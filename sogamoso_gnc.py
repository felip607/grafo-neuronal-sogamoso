# ==========================================
# Modelo GCN del Sistema de Captación de Sogamoso
# Autor: luis rodriguez
# Librerías requeridas:
#   pip install torch torch_geometric matplotlib networkx pandas
# ==========================================

import torch
from torch_geometric.data import Data
from torch_geometric.loader import DataLoader
from torch_geometric.nn import GCNConv
import matplotlib.pyplot as plt
import networkx as nx
import pandas as pd

# -----------------------------
# 1️⃣ Definición del grafo físico
# -----------------------------
# Nodos (12): 3 fuentes, 3 plantas, 5 tanques, 1 red DISTR
nodes = [
    "S1_LagoTota", "S2_RioTejar", "S3_PozoProfundo",
    "P_CH", "P_SUR", "P_MODE",
    "T_CH", "T_MODE", "T_CIRAL", "T_SB", "T_PORV",
    "DISTR"
]

# Conexiones (aristas dirigidas)
edges = [
    ("S1_LagoTota", "P_CH"),
    ("S1_LagoTota", "P_SUR"),
    ("S2_RioTejar", "P_MODE"),
    ("S3_PozoProfundo", "P_MODE"),
    ("P_CH", "T_CH"),
    ("P_CH", "T_CIRAL"),
    ("P_CH", "T_SB"),
    ("P_MODE", "T_MODE"),
    ("P_MODE", "T_SB"),
    ("T_CH", "DISTR"),
    ("T_MODE", "DISTR"),
    ("T_CIRAL", "DISTR"),
    ("T_SB", "DISTR"),
    ("T_PORV", "DISTR")
]

# Crear índices de nodos
node_to_idx = {n: i for i, n in enumerate(nodes)}

# Crear estructura edge_index (formato PyTorch Geometric)
edge_index = torch.tensor([[node_to_idx[a], node_to_idx[b]] for a, b in edges],
                          dtype=torch.long).t().contiguous()

# -----------------------------
# 2️⃣ Carga del dataset y preparación de datos
# -----------------------------
# Cargar el dataset generado por data.py
df = pd.read_csv("sogamoso_gcn_dataset.csv")

# Seleccionar features: caudales de todos los nodos (excluyendo pérdidas, volúmenes, presiones para simplicidad)
feature_cols = [col for col in df.columns if col.endswith('_caudal') and not col.startswith('DISTR')]
target_col = 'DISTR_caudal'

# Normalizar features (min-max scaling)
from sklearn.preprocessing import MinMaxScaler
scaler = MinMaxScaler()
df[feature_cols] = scaler.fit_transform(df[feature_cols])

# Crear lista de objetos Data para cada muestra
data_list = []
for _, row in df.iterrows():
    # Features: caudales de nodos (ordenados como nodes)
    x = torch.tensor([[row[f"{node}_caudal"]] for node in nodes[:-1]] + [[0]], dtype=torch.float)  # DISTR = 0
    y = torch.tensor([row[target_col]], dtype=torch.float)
    data_list.append(Data(x=x, edge_index=edge_index, y=y))

# Dividir en train/test (80/20)
train_size = int(0.8 * len(data_list))
train_data = data_list[:train_size]
test_data = data_list[train_size:]

# DataLoader para batching (batch_size=1 para evitar problemas de broadcasting)
train_loader = DataLoader(train_data, batch_size=1, shuffle=True)
test_loader = DataLoader(test_data, batch_size=1, shuffle=False)

# -----------------------------
# 3️⃣ Definición del modelo GCN
# -----------------------------
class SogamosoGCN(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = GCNConv(1, 16)   # Entrada → 16 características
        self.conv2 = GCNConv(16, 8)   # 16 → 8 características
        self.fc = torch.nn.Linear(8, 1)  # Salida final

    def forward(self, data):
        x, edge_index = data.x, data.edge_index
        x = torch.relu(self.conv1(x, edge_index))
        x = torch.relu(self.conv2(x, edge_index))
        # Tomar la representación del último nodo (DISTR)
        out = self.fc(x[-1])
        return out

# -----------------------------
# 4️⃣ Entrenamiento del modelo
# -----------------------------
model = SogamosoGCN()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
criterion = torch.nn.MSELoss()

losses = []
for epoch in range(200):
    epoch_loss = 0
    for batch in train_loader:
        optimizer.zero_grad()
        out = model(batch)
        loss = criterion(out, batch.y)
        loss.backward()
        optimizer.step()
        epoch_loss += loss.item()
    losses.append(epoch_loss / len(train_loader))

# Evaluación en test
model.eval()
test_losses = []
with torch.no_grad():
    for batch in test_loader:
        out = model(batch)
        loss = criterion(out, batch.y)
        test_losses.append(loss.item())
avg_test_loss = sum(test_losses) / len(test_losses)

print(f"\n🔹 Error MSE promedio en entrenamiento: {losses[-1]:.6f}")
print(f"🔹 Error MSE promedio en test: {avg_test_loss:.6f}")

# Predicción en una muestra de test
sample = test_data[0]
pred = model(sample).item()
actual = sample.y.item()
print(f"🔹 Predicción en DISTR (muestra test): {pred:.2f} L/s (real: {actual:.2f} L/s)")

# -----------------------------
# 5️⃣ Visualización del grafo físico
# -----------------------------
G = nx.DiGraph()
G.add_edges_from(edges)

colors = []
for n in G.nodes():
    if n.startswith("S"):
        colors.append("#5bc0de")  # Fuentes: azul claro
    elif n.startswith("P"):
        colors.append("#5cb85c")  # Plantas: verde
    elif n.startswith("T"):
        colors.append("#f0ad4e")  # Tanques: naranja
    else:
        colors.append("#d9534f")  # DISTR: rojo

plt.figure(figsize=(12, 6))
pos = nx.spring_layout(G, seed=42)
nx.draw(G, pos, with_labels=True, node_size=1800, node_color=colors,
        font_size=9, arrowsize=20, font_weight="bold")
plt.title("Grafo del Sistema de Captación de Sogamoso (para GCN)")
plt.show()

# -----------------------------
# 6️⃣ Visualización del entrenamiento
# -----------------------------
plt.figure()
plt.plot(losses)
plt.xlabel("Épocas")
plt.ylabel("Error cuadrático medio (MSE)")
plt.title("Entrenamiento del modelo GCN - SogamosoNet")
plt.grid(True)
plt.show()

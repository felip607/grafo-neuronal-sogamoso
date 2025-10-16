# === Sogamoso Graph Neural Simulation ===
import torch
import torch.nn as nn
import torch.nn.functional as F
import matplotlib.pyplot as plt
import networkx as nx

# -----------------------------
# 1️⃣ Definición de la red neuronal
# -----------------------------
class SogamosoNet(nn.Module):
    def __init__(self):
        super(SogamosoNet, self).__init__()
        # Capas: Fuentes (3) → Plantas (3) → Tanques (5) → Red (1)
        self.fc1 = nn.Linear(3, 3)   # S1,S2,S3 → P_CH,P_SUR,P_MODE
        self.fc2 = nn.Linear(3, 5)   # Plantas → Tanques
        self.fc3 = nn.Linear(5, 1)   # Tanques → DISTR

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        out = F.relu(self.fc3(x))
        return out

# -----------------------------
# 2️⃣ Entrenamiento del modelo
# -----------------------------
# Datos de entrada: caudales fuentes (S1,S2,S3)
X = torch.tensor([[250.0, 15.0, 10.0]])  # L/s
# Valor esperado de salida: demanda promedio de la red DISTR
Y_true = torch.tensor([[260.0]])

model = SogamosoNet()
optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
criterion = nn.MSELoss()

losses = []
for epoch in range(2000):
    optimizer.zero_grad()
    Y_pred = model(X)
    loss = criterion(Y_pred, Y_true)
    loss.backward()
    optimizer.step()
    losses.append(loss.item())

print("Caudal estimado final en DISTR:", model(X).item(), "L/s")

# -----------------------------
# 3️⃣ Visualización del grafo
# -----------------------------
G = nx.DiGraph()

# Nodos del sistema
layers = {
    "Fuentes": ["S1_LagoTota", "S2_RioTejar", "S3_PozoProfundo"],
    "Plantas": ["P_CH", "P_SUR", "P_MODE"],
    "Tanques": ["T_CH", "T_MODE", "T_CIRAL", "T_SB", "T_PORV"],
    "Salida": ["DISTR"]
}

# Crear nodos
for layer, nodes in layers.items():
    for node in nodes:
        G.add_node(node, layer=layer)

# Crear aristas entre capas
for s in layers["Fuentes"]:
    for p in layers["Plantas"]:
        G.add_edge(s, p)
for p in layers["Plantas"]:
    for t in layers["Tanques"]:
        G.add_edge(p, t)
for t in layers["Tanques"]:
    G.add_edge(t, "DISTR")

# Layout capas
pos = {}
y_offsets = {"Fuentes": 3, "Plantas": 2, "Tanques": 1, "Salida": 0}
x_spacing = {"Fuentes": 2, "Plantas": 2, "Tanques": 1.2, "Salida": 0}
for i, (layer, nodes) in enumerate(layers.items()):
    for j, node in enumerate(nodes):
        pos[node] = (j * x_spacing[layer], y_offsets[layer])

plt.figure(figsize=(12, 6))
nx.draw(G, pos, with_labels=True, node_size=1800,
        node_color=["#add8e6" if n.startswith("S") else
                    "#90ee90" if n.startswith("P") else
                    "#f4a460" if n.startswith("T") else "#ff6347"
                    for n in G.nodes()],
        arrowsize=20, font_size=9, font_weight="bold")

plt.title("Grafo Neuronal del Sistema de Captación de Sogamoso", fontsize=14)
plt.show()

# Mostrar curva de pérdida
plt.figure()
plt.plot(losses)
plt.xlabel("Épocas")
plt.ylabel("Error (MSE)")
plt.title("Entrenamiento del modelo SogamosoNet")
plt.grid(True)
plt.show()
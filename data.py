import pandas as pd
import numpy as np

# Definir nodos y sus tipos
nodes = [
    ("S1_LagoTota", "Fuente"),
    ("S2_RioTejar", "Fuente"),
    ("S3_PozoProfundo", "Fuente"),
    ("P_CH", "Planta"),
    ("P_SUR", "Planta"),
    ("P_MODE", "Planta"),
    ("T_CH", "Tanque"),
    ("T_MODE", "Tanque"),
    ("T_CIRAL", "Tanque"),
    ("T_SB", "Tanque"),
    ("T_PORV", "Tanque"),
    ("DISTR", "Red")
]

# Rangos de operación (basados en el POT)
ranges = {
    "S1_LagoTota": (250, 300),
    "S2_RioTejar": (10, 20),
    "S3_PozoProfundo": (8, 15),
    "P_CH": (340, 365),
    "P_SUR": (50, 60),
    "P_MODE": (25, 30),
    "T_CH": (100, 110),
    "T_MODE": (20, 25),
    "T_CIRAL": (10, 12),
    "T_SB": (10, 15),
    "T_PORV": (3, 6),
    "DISTR": (250, 310)
}

loss_ranges = {
    "P_CH": (35, 40),
    "P_SUR": (63, 70),
    "P_MODE": (60, 65),
    "T_CH": (2, 5),
    "T_MODE": (5, 8),
    "T_CIRAL": (5, 10),
    "T_SB": (5, 10),
    "T_PORV": (5, 10)
}

volumes = {
    "T_CH": 10000, "T_MODE": 856, "T_CIRAL": 350,
    "T_SB": 400, "T_PORV": 60
}

# Generar dataset
n_samples = 100
records = []
for i in range(n_samples):
    sample = {"sample_id": i+1}
    total_out = 0
    for node, tipo in nodes:
        caudal = np.random.uniform(*ranges[node])
        perdida = np.random.uniform(*loss_ranges.get(node, (0, 0)))
        volumen = volumes.get(node, np.nan)
        presion = np.random.uniform(25, 55) if tipo != "Fuente" else np.random.uniform(20, 30)
        sample.update({
            f"{node}_caudal": caudal,
            f"{node}_perdida": perdida,
            f"{node}_volumen": volumen,
            f"{node}_presion": presion
        })
        if node.startswith("S"):
            total_out += caudal
    sample["TotalEntrada"] = total_out
    sample["TotalDistribucion"] = np.random.uniform(250, 310)
    records.append(sample)

df = pd.DataFrame(records)
df.to_csv("sogamoso_gcn_dataset.csv", index=False)
print("Dataset generado: sogamoso_gcn_dataset.csv")
df.head()

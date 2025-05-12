import requests
import json
import random
import time

API_KEY = "10cdfe52d78663dabb6f6fbb90b15b56"
USERS = [
    "tb5FEV6KaONctG336qayFlHNjnw1",
    "egeRgKa5uwOHIc2qWhOQXPOORKp2"
]

GENRE_MAP = {
    28: "Acción",
    35: "Comedia",
    18: "Drama",
    878: "Ciencia Ficción",
    27: "Terror",
    10749: "Romántica"
}

URL = "https://api.themoviedb.org/3/discover/movie"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

all_movies = []

for page in range(1, 11):  # 10 páginas = hasta 200 pelis
    params = {
        "api_key": API_KEY,
        "language": "es-ES",
        "sort_by": "popularity.desc",
        "include_adult": False,
        "page": page
    }

    res = requests.get(URL, params=params)
    data = res.json()
    for m in data["results"]:
        if not m.get("poster_path"): continue
        genres = [GENRE_MAP[g] for g in m["genre_ids"] if g in GENRE_MAP]
        if not genres: continue
        peli = {
            "title": m["title"],
            "genre": genres[0],
            "rating": round(m["vote_average"] / 2, 1),
            "duration": random.randint(80, 180),
            "image": IMAGE_BASE + m["poster_path"]
        }
        all_movies.append(peli)
    time.sleep(0.25)

# Repartir entre usuarios
random.shuffle(all_movies)
split = len(all_movies) // 2
data = {
    "movies": {
        USERS[0]: {},
        USERS[1]: {}
    }
}

for i, peli in enumerate(all_movies[:split]):
    data["movies"][USERS[0]][f"movie_{i+1}"] = peli

for i, peli in enumerate(all_movies[split:]):
    data["movies"][USERS[1]][f"movie_{i+1}"] = peli

# Guardar a un JSON
with open("peliculas.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ Archivo 'peliculas.json' generado correctamente.")

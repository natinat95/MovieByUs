// ✅ FUNCIONES GLOBALES
window.syncInitialRatings = function (uid) {
  const db = firebase.database();
  const moviesRef = db.ref(`/movies/${uid}`);

  moviesRef.once("value", snapshot => {
    snapshot.forEach(child => {
      const movie = child.val();
      const key = child.key;
      const rating = parseFloat(movie.rating);

      if (!isNaN(rating)) {
        // Se guarda como voto inicial bajo el usuario "sistema"
        db.ref(`/ratings/${key}/sistema`).set(rating);
      }
    });
  });
};

window.syncInitialRatingsAll = function () {
  syncInitialRatings("tb5FEV6KaONctG336qayFlHNjnw1");
  syncInitialRatings("egeRgKa5uwOHIc2qWhOQXPOORKp2");
  showToast("Ratings sincronizados desde los datos base.", "success");
};

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600"
  };

  const toast = document.createElement("div");
  toast.className = `flex items-center ${colors[type] || "bg-gray-800"} text-white text-sm font-semibold px-4 py-3 rounded shadow-lg transition-opacity duration-300`;
  toast.innerHTML = `<i class="fas ${type === "error" ? "fa-times-circle" : "fa-check-circle"} mr-2"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function getAverageRating(movieId, callback) {
  firebase.database().ref(`/ratings/${movieId}`).once("value", snapshot => {
    const ratings = snapshot.val();
    if (!ratings) return callback(0);

    const total = Object.values(ratings).reduce((sum, val) => sum + val, 0);
    const avg = total / Object.values(ratings).length;
    callback(avg.toFixed(1));
  });
}

function calculateAverageRating(movieId) {
  getAverageRating(movieId, avg => {
    const span = document.getElementById(`rating-${movieId}`);
    if (span) span.innerText = avg || "Sin votos";

  });
}

function fadeIn(id) {
  const el = document.getElementById(id);
  if (!el) return console.warn(`No se encontró el elemento: ${id}`);
  el.classList.remove("hidden");
  setTimeout(() => el.classList.remove("opacity-0"), 10);
}

function fadeOut(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("opacity-0");
  setTimeout(() => el.classList.add("hidden"), 300);
}

function renderMovieCard(m, key = "", isMine = false, isTopRated = false, hideRating = false, preloadedRating = null) {
  const img = m.image ? m.image : "img/fondo.jpg";
  const movieId = m.key || key || btoa((m.title + "-" + m.duration).toLowerCase());

  const cardClass = isTopRated ? "card-top-rated" : "";
  console.log("🟢 movieId renderizado:", m.key);

  return `
      <div class="bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden shadow-md transition hover:scale-105 relative ${cardClass}">
      <img src="${img}" alt="${m.title}" onerror="this.onerror=null;this.src='img/fondo.jpg';" class="w-full h-48 object-cover">
        <div class="p-4">
          <h3 class="text-lg font-bold text-red-500 mb-1 truncate">${m.title}</h3>
          <p class="text-sm text-gray-300">🎬 Género: ${m.genre}</p>
          <p class="text-sm text-gray-300">⏱️ Duración: ${m.duration} min</p>
${!hideRating ? `<p class="text-sm text-gray-300">⭐ Puntuación: <span id="rating-${movieId}">${preloadedRating !== null ? preloadedRating : "Cargando..."}</span></p>` : ""}
  
          ${!isMine ? `
            <div class="flex mt-2 gap-1 text-yellow-400 stars" data-id="${movieId}">
              ${[1, 2, 3, 4, 5].map(n =>
    `<i class="fas fa-star cursor-pointer hover:text-yellow-300 transition" data-value="${n}"></i>`
  ).join('')}
            </div>` : ""}
  
            ${!isMine ? `
              <button onclick="toggleFavorite('${encodeURIComponent(JSON.stringify(m))}', '${movieId}')"
                class="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-sm px-3 py-1 rounded">⭐</button>
            ` : ""}
            
  
          ${isMine ? `<button onclick="deleteMovie('${key}')" class="absolute top-2 left-2 text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded">🗑️</button>` : ""}
        </div>
      ${!isTopRated ? `
  <button onclick="showCommentsModal('${movieId}')" class="mt-3 text-sm bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
    Ver comentarios
  </button>
` : ""}





      </div>

      

    `;
}

function clearForm() {
  document.getElementById("title").value = "";
  document.getElementById("genre").value = "";
  document.getElementById("rating").value = "";
  document.getElementById("duration").value = "";
  document.getElementById("image").value = "";
}

function activarSistemaDePuntuacion() {
  document.querySelectorAll(".stars").forEach(starGroup => {
    const movieId = starGroup.getAttribute("data-id");
    const uid = firebase.auth().currentUser?.uid;

    // Cargar media actual
    getAverageRating(movieId, avg => {
      const el = document.getElementById(`rating-${movieId}`);
      if (el) el.textContent = avg || "0.0";
    });
  });
}

function loadOtherMovies(myUid) {
  const contenedor = document.getElementById("other-movies");
  contenedor.innerHTML = "";

  firebase.database().ref("/movies").once("value", snapshot => {
    snapshot.forEach(userSnap => {
      if (userSnap.key !== myUid) {
        userSnap.forEach(child => {
          const m = child.val();
          const key = child.key;
          contenedor.innerHTML += renderMovieCard(m, key);
          calculateAverageRating(key);
        });
      }
    });
    activarSistemaDePuntuacion();
  });
}
function loadTopRatedMovies() {
  const topRatedContainer = document.getElementById("top-rated-slides");
  if (!topRatedContainer) return;

  firebase.database().ref("/ratings").once("value", ratingSnap => {
    const ratingsData = ratingSnap.val();
    if (!ratingsData) return;

    const avgRatings = Object.entries(ratingsData).map(([movieId, users]) => {
      const values = Object.values(users);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return { movieId, avg };
    }).sort((a, b) => b.avg - a.avg).slice(0, 10); // Top 10

    firebase.database().ref("/movies").once("value", movieSnap => {
      const allMovies = [];
      movieSnap.forEach(userSnap => {
        userSnap.forEach(child => {
          allMovies.push({ ...child.val(), key: child.key });
        });
      });

      topRatedContainer.innerHTML = "";

      const seenTitles = new Set();

      const slides = [];

    avgRatings.forEach(({ movieId, avg }) => {
      const movie = allMovies.find(m => m.key === movieId);
      if (movie && !seenTitles.has(movie.title)) {
        seenTitles.add(movie.title);

        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = renderMovieCard(movie, movieId, false, true);
        slides.push(slide);
        calculateAverageRating(movieId);
      }
    });

    // Añadir los originales
    slides.forEach(slide => topRatedContainer.appendChild(slide));
    // Añadir duplicados para que el loop funcione sin pausa
    slides.forEach(slide => topRatedContainer.appendChild(slide.cloneNode(true)));

      activarSistemaDePuntuacion();
     
      const canLoop = true;


      new Swiper(".topSwiper", {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: canLoop,
        autoplay: {
          delay: 1500,
          disableOnInteraction: false,
        },
        breakpoints: {
          640: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }
      });

    });
  });
}
// Llama a la función al cargar
loadTopRatedMovies();

function loadFavorites(uid) {
  const contenedor = document.getElementById("favorites-container");
  contenedor.innerHTML = "";

  firebase.database().ref(`/favorites/${uid}`).once("value", snapshot => {
    if (!snapshot.exists()) {
      contenedor.innerHTML = '<div class="text-center text-gray-400 col-span-full">No tienes películas favoritas aún.</div>';
      return;
    }

    snapshot.forEach(child => {
      const m = child.val();
      const key = child.key;
      contenedor.innerHTML += renderMovieCard(m, key);
      calculateAverageRating(key);
    });
    activarSistemaDePuntuacion();
  });
}

let currentMovieId = null;
let commentsListener = null;

window.showCommentsModal = function (movieId) {
  currentMovieId = movieId;

  const modal = document.getElementById("comment-modal");
  const container = document.getElementById("modal-comments-container");
  container.innerHTML = "<p class='text-gray-400 italic'>Cargando comentarios...</p>";
  modal.classList.remove("hidden");

  // Eliminar listener anterior si existe
  if (commentsListener) {
    firebase.database().ref(`/comments/${commentsListener}`).off("value");
  }
  commentsListener = movieId;

  // Escuchar en tiempo real los comentarios
  firebase.database().ref(`/comments/${movieId}`).on("value", snapshot => {
    container.innerHTML = "";

    if (!snapshot.exists()) {
      container.innerHTML = '<p class="text-gray-500 italic">No hay comentarios todavía.</p>';
      return;
    }

    const comments = [];
    snapshot.forEach(child => {
      const comment = child.val();
      comments.push({ ...comment, id: child.key });
    });


    // Ordenar de más reciente a más antiguo
    comments.sort((a, b) => b.timestamp - a.timestamp);

    // Obtener todos los nombres de usuario
    const userIds = [...new Set(comments.map(c => c.uid))];
    const userPromises = userIds.map(uid =>
      firebase.database().ref(`/users/${uid}/username`).once("value")
        .then(snap => ({ uid, username: snap.val() || "Usuario" }))
        .catch(() => ({ uid, username: "Usuario" }))
    );

    Promise.all(userPromises).then(users => {
      const userMap = {};
      users.forEach(({ uid, username }) => {
        userMap[uid] = username;
      });

      const currentUser = firebase.auth().currentUser;

      comments.forEach(comment => {
        const username = userMap[comment.uid] || "Usuario";
        const div = document.createElement("div");
        div.className = "bg-neutral-800 p-2 rounded text-sm border border-neutral-700 flex justify-between items-start";

        div.innerHTML = `
          <div>
            <strong class="text-red-400">${username}:</strong> ${comment.text}
          </div>
          ${currentUser?.uid === comment.uid ? `
            <button onclick="deleteComment('${movieId}', '${comment.id}')" class="text-gray-400 hover:text-red-500 ml-4 text-sm" title="Eliminar">
              🗑️
            </button>` : ""}
        `;

        container.appendChild(div);
      });

    });
  });
};



// Funciones de ventana
window.toggleFavorites = function () {
  fadeOut("my-movies-section");
  fadeOut("other-movies-section");
  fadeOut("recommendation-section");
  fadeIn("favorites-section");
  const uid = firebase.auth().currentUser?.uid;
  if (uid) loadFavorites(uid);
};

window.toggleMyMovies = function () {
  fadeIn("my-movies-section");
  fadeOut("other-movies-section");
  fadeOut("favorites-section");
  fadeOut("recommendation-section");

  const uid = firebase.auth().currentUser?.uid;
  if (uid) window.loadMyMovies(uid);
};

window.loadMyMovies = function (uid) {
  const contenedor = document.getElementById("my-movies");
  contenedor.innerHTML = "";

  firebase.database().ref(`/movies/${uid}`).once("value", snapshot => {
    if (!snapshot.exists()) {
      contenedor.innerHTML = '<div class="text-center text-gray-400 col-span-full">No has añadido películas aún.</div>';
      return;
    }

    snapshot.forEach(child => {
      const m = child.val();
      const key = child.key;
      contenedor.innerHTML += renderMovieCard(m, key, true); // isMine = true
      calculateAverageRating(key);
    });
    activarSistemaDePuntuacion();
  });
};

window.toggleOtherMovies = function () {
  fadeIn("other-movies-section");
  fadeOut("my-movies-section");
  fadeOut("recommendation-section");
  fadeOut("favorites-section");
  const add = document.getElementById("form-add");
  const rec = document.getElementById("form-recommendation");

  if (add && rec) {
    add.classList.remove("hidden");
    setTimeout(() => add.classList.remove("opacity-0"), 10);
    rec.classList.add("opacity-0");
    setTimeout(() => rec.classList.add("hidden"), 300);
  }

  loadOtherMovies(firebase.auth().currentUser.uid);
};

window.toggleRecommendation = function () {
  fadeIn("recommendation-section");
  fadeOut("my-movies-section");
  fadeOut("other-movies-section");
  fadeOut("favorites-section");

  const add = document.getElementById("form-add");
  const rec = document.getElementById("form-recommendation");

  if (add && rec) {
    add.classList.add("opacity-0");
    setTimeout(() => add.classList.add("hidden"), 300);
    rec.classList.remove("hidden");
    setTimeout(() => rec.classList.remove("opacity-0"), 10);
  }
};

window.generateRecommendation = async function (event) {
  event.preventDefault();

  const genre = document.getElementById('filter-genre').value;
  const minRating = parseFloat(document.getElementById('filter-rating').value);
  const maxDuration = parseInt(document.getElementById('filter-duration').value);
  const myUid = firebase.auth().currentUser?.uid;
  const result = document.getElementById("recommendation-result");
  const titleFilter = document.getElementById("filter-title").value.toLowerCase().trim();

  if (!myUid) return;
  result.innerHTML = "<p class='text-center text-gray-400'>Buscando películas...</p>";

  try {
    // ✅ Cargar todos los ratings desde Firebase
    const ratingsSnap = await firebase.database().ref("/ratings").once("value");
    const ratingsData = ratingsSnap.val() || {};

    // ✅ Cargar todas las películas
    const moviesSnap = await firebase.database().ref("/movies").once("value");
    let matches = [];

    moviesSnap.forEach(userSnap => {
      if (userSnap.key !== myUid) {
        userSnap.forEach(child => {
          const movie = child.val();
          const key = child.key;
          const matchTitle = titleFilter === "" || movie.title?.toLowerCase().includes(titleFilter);
          const movieDuration = parseInt(movie.duration);
          const movieGenre = movie.genre?.toLowerCase();

          // ✅ Media desde ratings reales en Firebase
          const ratingValues = ratingsData[key] ? Object.values(ratingsData[key]) : [];
          const avgRating = ratingValues.length > 0
            ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
            : 0;

          const matchGenre = genre === "" || movieGenre === genre.toLowerCase();
          const matchRating = isNaN(minRating) || avgRating >= minRating;
          const matchDuration = isNaN(maxDuration) || (!isNaN(movieDuration) && movieDuration <= maxDuration);

          if (matchTitle && matchGenre && matchRating && matchDuration) {
            matches.push({ ...movie, key, avgRating: avgRating.toFixed(1) });
          }

        });
      }
    });

    // ✅ Mostrar resultados
    if (matches.length === 0) {
      result.innerHTML = '<div class="text-center text-gray-400 col-span-full">No se encontraron películas que coincidan con los filtros.</div>';
    } else {
      result.innerHTML = "";

      matches.forEach(movie => {
        // Aseguramos que movie.key esté definido
        const movieId = movie.key;
        result.innerHTML += renderMovieCard(movie, movie.key, false, false, false, movie.avgRating);
      });

      // ✅ Después de renderizar, actualizar cada puntuación individualmente
      matches.forEach(movie => {
        const movieId = movie.key;

        // Calcular y mostrar la puntuación directamente, sin esperar
        getAverageRating(movieId, avg => {
          const ratingElement = document.getElementById(`rating-${movieId}`);
          if (ratingElement) {
            ratingElement.innerText = avg || "Sin votos";
          }
        });
      });

      // Activar sistema de puntuación después de renderizar
      activarSistemaDePuntuacion();
    }
  } catch (error) {
    console.error("Error en generateRecommendation:", error);
    result.innerHTML = '<div class="text-center text-red-500 col-span-full">Error al buscar películas. Inténtalo de nuevo.</div>';
    showToast("Error al buscar recomendaciones: " + error.message, "error");
  }
};



window.toggleFavorite = function (peliculaEncoded, movieId) {
  const uid = firebase.auth().currentUser?.uid;
  if (!uid) return showToast("Debes iniciar sesión", "error");

  const pelicula = JSON.parse(decodeURIComponent(peliculaEncoded));
  const favRef = firebase.database().ref(`/favorites/${uid}/${movieId}`);

  favRef.once("value").then(snapshot => {
    if (snapshot.exists()) {
      favRef.remove()
        .then(() => {
          showToast("Película eliminada de favoritos");
          const favSection = document.getElementById("favorites-section");
          if (!favSection.classList.contains("hidden")) {
            loadFavorites(uid); // 🔄 recargar si estamos viendo favoritos
          }
        });
    } else {
      favRef.set(pelicula)
        .then(() => {
          showToast("Película añadida a favoritos");
          const favSection = document.getElementById("favorites-section");
          if (!favSection.classList.contains("hidden")) {
            loadFavorites(uid); // también se puede actualizar tras añadir si quieres
          }
        });
    }
  }).catch(err => showToast("Error: " + err.message, "error"));
};

window.addMovie = function () {
  const title = document.getElementById("title").value.trim();
  const genre = document.getElementById("genre").value.trim();
  const rating = parseFloat(document.getElementById("rating").value);
  const duration = parseInt(document.getElementById("duration").value);
  const image = document.getElementById("image").value.trim();
  const user = firebase.auth().currentUser;

  if (!user) return showToast("No has iniciado sesión", "error");
  if (!title || !genre || isNaN(rating) || isNaN(duration)) {
    return showToast("Rellena todos los campos obligatorios", "error");
  }
  if (rating < 1 || rating > 5) {
    return showToast("La puntuación debe estar entre 1 y 5", "error");
  }

  const movie = { title, genre, rating, duration };
  if (image) movie.image = image;

  const userUid = user.uid;
  const movieRef = firebase.database().ref(`/movies/${userUid}`).push();

  movieRef.set(movie)
    .then(() => {
      // ✅ Guardar la puntuación como voto inicial
      const movieId = movieRef.key;
      return firebase.database().ref(`/ratings/${movieId}/${userUid}`).set(rating);
    })
    .then(() => {
      showToast("Película guardada correctamente");
      clearForm();
      window.loadMyMovies(userUid);
    })
    .catch(error => {
      console.error(error);
      showToast("Error al guardar: " + error.message, "error");
    });
};


window.deleteMovie = function (movieId) {
  const uid = firebase.auth().currentUser?.uid;
  if (!uid || !movieId) return;

  firebase.database().ref(`/movies/${uid}/${movieId}`).remove()
    .then(() => {
      showToast("Película eliminada");

      // Si está visible la sección de mis películas, la recargamos
      const section = document.getElementById("my-movies-section");
      if (!section.classList.contains("hidden")) {
        loadMyMovies(uid);
      }
    })
    .catch(err => {
      showToast("Error al eliminar: " + err.message, "error");
    });
};

window.deleteComment = function (movieId, commentId) {
  if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) return;

  firebase.database().ref(`/comments/${movieId}/${commentId}`).remove()
    .then(() => {
      showToast("Comentario eliminado");
    })
    .catch(error => {
      console.error(error);
      showToast("Error al eliminar comentario", "error");
    });
};


// Inicialización cuando se carga el DOM
window.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.database();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut().then(() => {
        window.location.href = "index.html";
      });
    });
  }

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "index.html";
    } else {
      loadOtherMovies(user.uid);
    }
  });

  // Añadir eventos de estrellas a nivel global
  document.addEventListener("click", function (e) {
    if (e.target.closest(".stars i")) {
      const star = e.target;
      const starGroup = star.closest(".stars");
      const movieId = starGroup.getAttribute("data-id");
      const value = parseInt(star.getAttribute("data-value"));
      const uid = firebase.auth().currentUser?.uid;

      if (!uid) return showToast("Inicia sesión para puntuar", "error");

      firebase.database().ref(`/ratings/${movieId}/${uid}`).set(value)
        .then(() => {
          showToast("¡Gracias por votar!");
          calculateAverageRating(movieId);

          // ✅ Actualiza también la puntuación en recomendaciones
          const ratingSpan = document.getElementById(`rating-${movieId}`);
          if (ratingSpan) {
            getAverageRating(movieId, avg => {
              ratingSpan.innerText = avg || "Sin votos";
            });
          }
        })
        .catch(err => {
          console.error("Error al guardar puntuación:", err);
          showToast("Error al votar", "error");
        });
    }
  });



  document.getElementById("send-comment").addEventListener("click", () => {
    const user = firebase.auth().currentUser;
    const input = document.getElementById("new-comment");
    const text = input.value.trim();

    if (!user) {
      showToast("Debes iniciar sesión para comentar", "error");
      return;
    }
    if (!text) {
      showToast("El comentario no puede estar vacío", "error");
      return;
    }

    if (!currentMovieId) {
      showToast("Error interno: no hay película seleccionada.", "error");
      return;
    }

    const newComment = {
      uid: user.uid,
      text: text,
      timestamp: Date.now()
    };

    firebase.database().ref(`/comments/${currentMovieId}`).push(newComment)
      .then(() => {
        showToast("Comentario publicado");
        input.value = ""; // ✅ limpiar campo
        // ❌ NO volver a llamar a showCommentsModal
      })
      .catch((error) => {
        console.error(error);
        showToast("Error al publicar comentario", "error");
      });
  });



  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("comment-modal").classList.add("hidden");

    // 🔇 Detener la escucha cuando se cierra
    if (commentsListener) {
      firebase.database().ref(`/comments/${commentsListener}`).off("value");
      commentsListener = null;
    }
  });

});




window.postComment = function (movieId) {
  const user = firebase.auth().currentUser;
  if (!user) {
    return showToast("Debes iniciar sesión para comentar", "error");
  }

  const input = document.getElementById(`comment-input-${movieId}`);
  const text = input.value.trim();

  if (!text) {
    return showToast("El comentario no puede estar vacío", "error");
  }

  const newComment = {
    uid: user.uid,
    text: text,
    timestamp: Date.now()
  };

  firebase.database().ref(`/comments/${movieId}`).push(newComment)
    .then(() => {
      showToast("Comentario publicado");
      input.value = "";
      loadComments(movieId); // 🔄 Recargar comentarios después de comentar
    })
    .catch((error) => {
      console.error(error);
      showToast("Error al publicar comentario", "error");
    });
};

function loadComments(movieId) {
  const container = document.getElementById(`comments-${movieId}`);
  if (!container) return;

  firebase.database().ref(`/comments/${movieId}`).orderByKey().once('value', snapshot => {
    container.innerHTML = "";

    if (!snapshot.exists()) {
      container.innerHTML = '<p class="text-gray-500 italic">Sé el primero en comentar</p>';
      return;
    }

    const comments = [];
    snapshot.forEach(child => {
      const comment = child.val();
      comments.push(comment);
    });

    const userIds = [...new Set(comments.map(c => c.uid))];
    const userPromises = userIds.map(uid =>
      firebase.database().ref(`/users/${uid}/username`).once('value').then(snap => ({ uid, username: snap.val() }))
    );

    Promise.all(userPromises).then(users => {
      const userMap = {};
      users.forEach(({ uid, username }) => {
        userMap[uid] = username || uid;
      });

      comments.forEach(comment => {
        const username = userMap[comment.uid] || "Usuario";

        const commentDiv = document.createElement('div');
        commentDiv.className = "bg-neutral-800 rounded-lg p-3 flex items-start gap-3 border border-neutral-700";

        commentDiv.innerHTML = `
          <div class="flex-shrink-0">
            <i class="fas fa-user-circle text-2xl text-gray-400 mt-1"></i>
          </div>
          <div class="flex-1">
            <p class="text-sm text-red-400 font-semibold">${username}</p>
            <p class="text-sm text-gray-200">${comment.text}</p>
          </div>
        `;

        container.appendChild(commentDiv);
      });
    });
  });
}






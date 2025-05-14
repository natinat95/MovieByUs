

// ✅ Mostrar mensajes flotantes
function showToast(message, type) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600"
  };

  const toast = document.createElement("div");
  toast.className = `flex items-center ${colors[type] || "bg-gray-800"} text-white text-sm font-semibold px-4 py-3 rounded shadow-lg transition-opacity duration-300 animate-fade-in`;
  toast.innerHTML = `<i class="fas ${type === "error" ? "fa-times-circle" : "fa-check-circle"} mr-2"></i> ${message}`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ✅ Configurar Swiper del slider
var swiper = new Swiper(".mySwiper", {
  effect: "fade",
  speed: 1000,
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  }
});

// ✅ Efecto scroll para header
window.addEventListener('scroll', function() {
  const logoContainer = document.getElementById('logoContainer');
  if (window.scrollY > 50) {
    logoContainer.classList.add('scrolled');
  } else {
    logoContainer.classList.remove('scrolled');
  }
});

// ✅ Al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginContent = document.getElementById('login-content');
  const registerContent = document.getElementById('register-content');

  if (!loginTab || !registerTab || !loginContent || !registerContent) {
    console.error('Elementos de pestañas de login/registro no encontrados.');
    return;
  }

  function showLogin() {
    loginTab.classList.add('tab-active');
    registerTab.classList.remove('tab-active');
    loginContent.classList.remove('hidden');
    registerContent.classList.add('hidden');
  }

  function showRegister() {
    registerTab.classList.add('tab-active');
    loginTab.classList.remove('tab-active');
    registerContent.classList.remove('hidden');
    loginContent.classList.add('hidden');
  }

  loginTab.addEventListener('click', showLogin);
  registerTab.addEventListener('click', showRegister);

  showLogin(); // mostrar login al cargar

  // Animación del logo al cargar
  const logoContent = document.querySelector('.logo-content');
  if (logoContent) {
    logoContent.style.opacity = '0';
    logoContent.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      logoContent.style.transition = 'all 1s ease';
      logoContent.style.opacity = '1';
      logoContent.style.transform = 'translateY(0)';
    }, 300);
  }
  loadRandomTestimonials();

});

// ✅ Función global para REGISTRAR usuario
document.addEventListener('DOMContentLoaded', function() {
  const registerButton = document.getElementById('register-button');

  if (registerButton) {
    registerButton.addEventListener('click', function (e) {
      e.preventDefault(); // Previene comportamiento por defecto
      const username = document.getElementById("register-username").value.trim();
      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value.trim();
      const confirm = document.getElementById("register-confirm").value.trim();
      const termsChecked = document.getElementById("terms")?.checked;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!username) {
        return showToast("Introduce un nombre de usuario", "error");
      }

      if (!email || !emailRegex.test(email)) {
        return showToast("Introduce un correo válido", "error");
      }

      if (!password || password.length < 6) {
        return showToast("La contraseña debe tener al menos 6 caracteres", "error");
      }

      if (password !== confirm) {
        return showToast("Las contraseñas no coinciden", "error");
      }

      if (!termsChecked) {
        return showToast("Debes aceptar los términos y condiciones", "error");
      }

      firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const uid = userCredential.user.uid;
        return firebase.database().ref(`/users/${uid}`).set({
          username: document.getElementById("register-username").value.trim()
        });
      })
      .then(() => {
        showToast("Cuenta creada con éxito. Ahora inicia sesión.");
        showLogin(); // Redirige a iniciar sesión
      })    
      .catch((error) => {
        console.error(error);
        showToast("Error al registrar: " + error.message, "error");
      });
    });
  }
});


// ✅ Función global para mostrar/ocultar contraseña
window.togglePassword = function (inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = "password";
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
};

// ✅ Función global para RESET de contraseña
window.resetPassword = function () {
  const email = document.getElementById("login-email").value.trim();

  if (!email) {
    return showToast("Introduce tu correo para restablecer la contraseña", "error");
  }

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      showToast("Se ha enviado un correo para restablecer tu contraseña", "success");
    })
    .catch((error) => {
      console.error(error);
      showToast("Error al enviar el correo: " + error.message, "error");
    });
};

window.showLogin = function() {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginContent = document.getElementById('login-content');
  const registerContent = document.getElementById('register-content');

  if (!loginTab || !registerTab || !loginContent || !registerContent) {
    console.error('Elementos de login/register no encontrados al hacer showLogin');
    return;
  }

  loginTab.classList.add('tab-active');
  registerTab.classList.remove('tab-active');
  loginContent.classList.remove('hidden');
  registerContent.classList.add('hidden');
};
function loadRandomTestimonials() {
  const container = document.getElementById("dynamic-testimonials");
  if (!container) return;

  const db = firebase.database();
  db.ref("/comments").once("value").then(snapshot => {
    const allComments = [];

    snapshot.forEach(movieSnap => {
      movieSnap.forEach(commentSnap => {
        const comment = commentSnap.val();
        comment.id = commentSnap.key;
        allComments.push(comment);
      });
    });

    // Mezclar y seleccionar 3 comentarios aleatorios
    const shuffled = allComments.sort(() => 0.5 - Math.random()).slice(0, 3);
    const userIds = [...new Set(shuffled.map(c => c.uid))];

    // Obtener nombres de usuario
    const userPromises = userIds.map(uid =>
      db.ref(`/users/${uid}/username`).once("value").then(snap => ({ uid, username: snap.val() || "Anónimo" }))
    );

    Promise.all(userPromises).then(users => {
      const userMap = {};
      users.forEach(({ uid, username }) => userMap[uid] = username);

      container.innerHTML = ""; // Limpiar contenedor
      shuffled.forEach(comment => {
        const username = userMap[comment.uid] || "Anónimo";
        const initial = username.charAt(0).toUpperCase();

        const html = `
        <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 relative">
          <div class="absolute -top-5 left-6">
            <div class="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <i class="fas fa-quote-left text-white"></i>
            </div>
          </div>
          <p class="text-gray-300 mb-4 mt-2">${comment.text}</p>
          <div class="flex items-center">
            <div class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-red-500">${initial}</div>
            <div class="ml-3">
              <p class="font-semibold">${username}</p>
              <div class="flex text-yellow-400 text-sm">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star-half-alt"></i>
              </div>
            </div>
          </div>
        </div>
        `;
        container.innerHTML += html;
      });
    });
  });
}

//  Mostrar y ocultar preloader al cargar
window.addEventListener('load', function () {
  const preloader = document.getElementById('preloader');
  setTimeout(() => {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 300);
  }, 500);
});

// ✅ Botón de scroll to top
document.addEventListener('DOMContentLoaded', function () {
  const scrollToTopButton = document.getElementById('scroll-to-top');

  if (!scrollToTopButton) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 300) {
      scrollToTopButton.classList.remove('scale-0');
      scrollToTopButton.classList.add('scale-100');
    } else {
      scrollToTopButton.classList.remove('scale-100');
      scrollToTopButton.classList.add('scale-0');
    }
  });

  scrollToTopButton.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});


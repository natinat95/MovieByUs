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

window.addEventListener('scroll', function () {
  const logoContainer = document.getElementById('logoContainer');
  if (logoContainer) {
    if (window.scrollY > 50) {
      logoContainer.classList.add('scrolled');
    } else {
      logoContainer.classList.remove('scrolled');
    }
  }
});

window.showLogin = function () {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginContent = document.getElementById('login-content');
  const registerContent = document.getElementById('register-content');

  if (!loginTab || !registerTab || !loginContent || !registerContent) {
    console.error('Elementos de login/register no encontrados');
    return;
  }

  loginTab.classList.add('tab-active');
  registerTab.classList.remove('tab-active');
  loginContent.classList.remove('hidden');
  registerContent.classList.add('hidden');
};

function showRegister() {
  const registerTab = document.getElementById('register-tab');
  const loginTab = document.getElementById('login-tab');
  const registerContent = document.getElementById('register-content');
  const loginContent = document.getElementById('login-content');

  if (!loginTab || !registerTab || !loginContent || !registerContent) {
    console.error('Elementos de login/register no encontrados');
    return;
  }

  registerTab.classList.add('tab-active');
  loginTab.classList.remove('tab-active');
  registerContent.classList.remove('hidden');
  loginContent.classList.add('hidden');
}

window.togglePassword = function (inputId, icon) {
  const input = document.getElementById(inputId);
  if (!input || !icon) return;

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

function initAuthTabs() {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');

  if (!loginTab || !registerTab) {
    console.error('Elementos de pestañas de login/registro no encontrados.');
    return;
  }

  loginTab.addEventListener('click', window.showLogin);
  registerTab.addEventListener('click', showRegister);

  window.showLogin();
}
function initLoginButton() {
  const loginButton = document.getElementById('login-button');

  if (!loginButton) return;

  loginButton.addEventListener('click', function (e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return showToast("Introduce un correo válido", "error");
    }

    if (!password) {
      return showToast("Introduce tu contraseña", "error");
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        showToast("Inicio de sesión exitoso", "success");
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 1500);
      })
      .catch((error) => {
        console.error(error);

        switch (error.code) {
          case "auth/user-not-found":
            showToast("No existe una cuenta con este correo", "error");
            break;
          case "auth/wrong-password":
            showToast("Contraseña incorrecta", "error");
            break;
          case "auth/invalid-email":
            showToast("El formato del correo es inválido", "error");
            break;
          case "auth/user-disabled":
            showToast("Esta cuenta ha sido deshabilitada", "error");
            break;
          case "auth/too-many-requests":
            showToast("Demasiados intentos fallidos. Intenta más tarde", "error");
            break;
          default:
            showToast("Correo electrónico o contraseña incorrectos", "error");
        }
      });
  });
}
function initRegisterButton() {
  const registerButton = document.getElementById('register-button');

  if (!registerButton) return;

  registerButton.addEventListener('click', function (e) {
    e.preventDefault();

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
          username: username
        });
      })
      .then(() => {
        showToast("Cuenta creada con éxito. Ahora inicia sesión.", "success");
        window.showLogin();
      })
      .catch((error) => {
        console.error(error);

        if (error.code === "auth/email-already-in-use") {
          showToast("Ese correo ya está registrado. Intenta iniciar sesión o usa otro.", "error");
        } else {
          showToast("Error al registrar: " + error.message, "error");
        }
      });
  });
}

function initLogoAnimation() {
  const logoContent = document.querySelector('.logo-content');

  if (!logoContent) return;

  logoContent.style.opacity = '0';
  logoContent.style.transform = 'translateY(-20px)';

  setTimeout(() => {
    logoContent.style.transition = 'all 1s ease';
    logoContent.style.opacity = '1';
    logoContent.style.transform = 'translateY(0)';
  }, 300);
}

function initScrollToTop() {
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
}

function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const overlay = document.getElementById('cookie-overlay');
  const acceptBtn = document.getElementById('accept-cookies');
  const infoBtn = document.getElementById('more-info');

  if (!banner || !overlay || !acceptBtn || !infoBtn) return;

  const showCookieDialog = () => {
    banner.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
    banner.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');

    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100', 'pointer-events-auto');
  };

  const hideCookieDialog = () => {
    banner.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
    banner.classList.add('opacity-0', 'pointer-events-none', 'scale-95');

    overlay.classList.remove('opacity-100', 'pointer-events-auto');
    overlay.classList.add('opacity-0', 'pointer-events-none');
  };

  if (!localStorage.getItem('cookies-accepted')) {
    showCookieDialog();
  }

  acceptBtn.addEventListener('click', function () {
    localStorage.setItem('cookies-accepted', 'true');
    hideCookieDialog();
  });

  infoBtn.addEventListener('click', function () {
    window.location.href = 'politica-de-cookies.html';
  });
}

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

    const shuffled = allComments.sort(() => 0.5 - Math.random()).slice(0, 3);
    const userIds = [...new Set(shuffled.map(c => c.uid))];

    const userPromises = userIds.map(uid =>
      db.ref(`/users/${uid}/username`).once("value").then(snap => ({ uid, username: snap.val() || "Anónimo" }))
    );

    Promise.all(userPromises).then(users => {
      const userMap = {};
      users.forEach(({ uid, username }) => userMap[uid] = username);

      container.innerHTML = "";

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
    }).catch(error => {
      console.error('Error loading testimonials:', error);
    });
  }).catch(error => {
    console.error('Error accessing comments:', error);
  });
}

window.addEventListener('load', function () {
  const preloader = document.getElementById('preloader');

  if (!preloader) return;

  setTimeout(() => {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 300);
  }, 500);
});

document.addEventListener('DOMContentLoaded', function () {
  initAuthTabs();
  initLoginButton();
  initRegisterButton();
  initLogoAnimation();
  initScrollToTop();
  initCookieBanner();
  loadRandomTestimonials();
});

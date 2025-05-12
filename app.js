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
  

window.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
  
    window.togglePassword = function (inputId, icon) {
      const input = document.getElementById(inputId);
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    };
  
    window.showForm = function (type) {
      document.getElementById("login-form").classList.add("hidden");
      document.getElementById("register-form").classList.add("hidden");
  
      if (type === "login") {
        document.getElementById("login-form").classList.remove("hidden");
      } else {
        document.getElementById("register-form").classList.remove("hidden");
      }
    };
  
    window.register = function () {
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const confirm = document.getElementById("register-confirm").value;
  
      if (password !== confirm) {
        showToast("Las contraseñas no coinciden", "error");
        return;
      }
  
      auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            showToast("¡Registro exitoso!");
            showForm("login");
        })
        .catch(error => {
        showToast("Error: " + error.message, "error");
        });
    };
  
    window.login = function () {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
  
      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = "home.html";
        })
        .catch(error => {
            showToast("Error, comprueba el email y la contraseña.");
        });
    };


  });
  
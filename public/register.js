document.getElementById("registerForm").addEventListener("submit", async function(event) {
            event.preventDefault(); // Prevent form from refreshing the page

            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            const response = await fetch("https://ferdro-energy.onrender.com/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Registration successful!.");
                window.location.href = "login.html"; // Redirect to login page
            } else {
                alert(data.message); // Show error message
            }
        });

     async function loginUser() {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const messageElement = document.getElementById("message");

            // Reset message
            messageElement.textContent = "";
            messageElement.classList.remove("success");

            if (!email || !password) {
                messageElement.textContent = "Email and password are required!";
                return;
            }

            try {
                const response = await fetch("/login", {  //when hosting online we put the URI before/login
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                messageElement.textContent = data.message;

                if (response.status === 200) {
                    messageElement.classList.add("success");
                    localStorage.setItem("isloggedIn", "true");//store login status

                    //this localstorage below can make your login page not to redirect users to dashboard 
                    //after logging in, if the local storage.setItem name ("loggedInUsers") is not also named as 
                    //loggedInUsers in dashboard.html. and this was a big snag for me while doing this project
                    localStorage.setItem("loggedInUser", data.username); //store username if needed
                     localStorage.setItem("userRole", data.role);//Store role (admin/user)
                    console.log("Recieved role:",data.role);// Debugging line

                      // Check if the user is an admin 
            if (data.role === "admin") { 
                setTimeout(() => {
                    window.location.href = "admin.html"; // Redirect admin to admin page
                }, 2000);
            } else {
                    setTimeout(() => {
                        window.location.href = "Dashboard.html"; // Redirect after successful login
                    }, 2000);
                  }
                }
            } catch (error) {
                console.error("Error:", error);
                messageElement.textContent = "Something went wrong. Try again!";
            }
        }

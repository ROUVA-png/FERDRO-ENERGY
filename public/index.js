 //   let slideIndex = 0;
      //  const slides = document.querySelectorAll(".slide");

       // function showSlide(index) {
         //   slides.forEach(slide => slide.style.opacity = "0");
           // slideIndex = (index + slides.length) % slides.length;
            //slides[slideIndex].style.opacity = "1";
        //}

        //function changeSlide(n) {
          //  showSlide(slideIndex + n);
        //}

        //setInterval(() => changeSlide(1), 4000);
        //showSlide(slideIndex);




        //For text ann//
         let slideIndex = 0;
const slides = document.querySelectorAll(".slide");

function showSlide(index) {
    slides.forEach(slide => {
        slide.style.opacity = "0"; 
        slide.querySelector(".text").classList.remove("fade-in"); // Remove fade-in class
    });

    slideIndex = (index + slides.length) % slides.length;
    slides[slideIndex].style.opacity = "1";
    
    // Add fade-in animation to text
    setTimeout(() => {
        slides[slideIndex].querySelector(".text").classList.add("fade-in");
    }, 200); // Small delay for better effect
}


        function changeSlide(n) {
            showSlide(slideIndex + n);
        }

        setInterval(() => changeSlide(1), 5000);
        showSlide(slideIndex);


        
//below  is the Js code for login and register button click redirect in the homepage using javascript >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("joinUsButton").addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "register.html";
    });

    document.getElementById("loginButton").addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = "login.html";
    });
});


document.addEventListener("DOMContentLoaded", function () {
        let loggedInUser = localStorage.getItem("loggedInUser");

        if (loggedInUser) {
            // If user is logged in, redirect them to the dashboard
            window.location.href = "Dashboard.html";
        }
    });
// below is the script code for hmburger/toggle menu
    function toggleMenu() {
        document.querySelector(".nav-links").classList.toggle("show");
    }
    
//Below is the code to check if frontend is connected to backend
        fetch("https://ferdro-energy.onrender.com/api/test")
    .then(response => response.json())
    .then(data => console.log(data.message))
    .catch(error => console.error("Error:", error));

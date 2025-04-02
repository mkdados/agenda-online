$( document ).ready(function() {


     /*Carrega carousel login====================================================================*/
     fetch('models/carousel-login.html')
     .then(response => response.text())
     .then(data => {
     document.getElementById('carousel-login').outerHTML = data;
     });

     
    
});


   
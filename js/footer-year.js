// Mise à jour automatique de l'année du copyright
(function() {
    const currentYear = new Date().getFullYear();
    const copyrightElements = document.querySelectorAll('.copyright');
    
    copyrightElements.forEach(function(element) {
        if (element.textContent) {
            // Remplace l'année dans le texte du copyright
            element.textContent = element.textContent.replace(/\d{4}/, currentYear);
        }
    });
})();


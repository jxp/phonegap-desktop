(function() {

    $('#notification-alert').bind('tap', function() {
        navigator.notification.alert(
            // Message
            'Howdy Sir!',
            
            // Callback
            function() { navigator.notification.alert('Button pressed'); },
            
            // Title (Optional)
            'Greetings',
            
            // Button Name
            'Good day to you'
        );
    });

    $('#notification-confirm').bind('tap', function() {
        navigator.notification.confirm(
            // Message
            'Sir or Madam?',
            
            // Callback
            function(index) {
                var gender = (index === 1) ? 'sir' : 'madam';
                navigator.notification.alert('Good day ' + gender);
            },
            
            // Title (Optional)
            'Greetings',
            
            // Button Name
            'Sir,Madam'
        );
    });

    $('#notification-vibrate').bind('tap', function() {
        navigator.notification.vibrate(2500);
    });

})();

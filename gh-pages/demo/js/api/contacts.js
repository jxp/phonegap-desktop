(function() {

    $('#contacts').bind('pageshow', function() {
        // Insert the contacts into the list
        //
        var onSuccess = function(contacts) {
            // For demo purposes, only load 10
            contacts = contacts.slice(0, 10);
            
            // Helper function to find contacts last name
            var lastName = function(name) {
                name = name.split(' ');
                return name[name.length - 1];
            };

            // Sort contacts by last name
            contacts.sort(function(a, b) {
                if (!a.displayName) return -1;
                if (!b.displayName) return  1;

                a = lastName(a.displayName.toLowerCase());
                b = lastName(b.displayName.toLowerCase());

                if (a > b)
                    return 1;
                else if (a < b)
                    return -1;
                else
                    return 0;
            });

            var currentGroup = null;
            var content      = '';
            var $contactList = $('#contacts ul[data-role="listview"]');

            contacts.forEach(function(contact) {
                // Create a last name group if needed
                var group = lastName(contact.displayName);
                if (group.length <= 0) return;
                group = group[0].toUpperCase();

                if (group !== currentGroup) {
                    currentGroup = group;
                    content += '<li data-role="list-divider">' +
                               currentGroup +
                               '</li>';
                }

                content += '<li>' + contact.displayName + '</li>';
            });

            $contactList.html(content).listview('refresh');
        };

        var onFail = function() {
            console.log('Failed to get contacts');
        };

        var filter       = [ 'displayName' ];
        var options      = new ContactFindOptions();
        options.filter   = '';
        options.multiple = true;

        navigator.contacts.find(filter, onSuccess, onFail, options);
    });

})();

/**
 * Pin Form for Pinry
 * Descrip: This is for creation new pins on everything, the bookmarklet, on the
 *          site and even editing pins in some limited situations.
 * Authors: Pinry Contributors
 * Updated: Feb 27th, 2013
 * Require: jQuery, Pinry JavaScript Helpers
 */


$(window).load(function() {
    var uploadedImage = false;

    // Start Helper Functions
    function getFormData() {
        return {
            submitter: currentUser,
            url: $('#pin-form-image-url').val(),
            description: $('#pin-form-description').val(),
            tags: cleanTags($('#pin-form-tags').val())
        }
    }

    function createPinPreviewFromForm() {
        var context = {pins: [{
                submitter: currentUser,
                image: {thumbnail: {image: $('#pin-form-image-url').val()}},
                description: $('#pin-form-description').val(),
                tags: cleanTags($('#pin-form-tags').val())
            }]},
            html = renderTemplate('#pins-template', context),
            preview = $('#pin-form-image-preview');
        preview.html(html);
        preview.find('.pin').width(200);
        preview.find('.pin .text').width(140);
        if (preview.find('.pin').height() > 305)
            $('#pin-form .modal-body').height(preview.find('.pin').height());
    }

    function dismissModal(modal) {
        modal.modal('hide');
        setTimeout(function() {
            modal.remove();
        }, 200);
    }
    // End Helper Functions


    // Start View Functions
    function createPinForm() {
        $('body').append(renderTemplate('#pin-form-template', ''));
        var modal = $('#pin-form'),
            formFields = [$('#pin-form-image-url'), $('#pin-form-description'),
            $('#pin-form-tags')],
            pinFromUrl = getUrlParameter('pin-image-url');
        modal.modal('show');
        // Auto update preview on field changes
        for (var i in formFields) {
            formFields[i].bind('propertychange keyup input paste', function() {
                createPinPreviewFromForm();
                if (!uploadedImage)
                    $('#pin-form-image-upload').parent().parent().css('display', 'none');
            });
        }
        // Drag and Drop Upload
        $('#pin-form-image-upload').fineUploader({
            request: {
                endpoint: '/pins/create-image/',
                paramsInBody: true,
                multiple: false,
                validation: {
                    allowedExtensions: ['jpeg', 'jpg', 'png', 'gif']
                },
                text: {
                    uploadButton: 'Click or Drop'
                }
            }
        }).on('complete', function(e, id, name, data) {
            $('#pin-form-image-url').parent().parent().css('display', 'none');
            $('.qq-upload-button').css('display', 'none');
            var promise = getImageData(data.success.id);
            uploadedImage = data.success.id;
            promise.success(function(image) {
                $('#pin-form-image-url').val(image.thumbnail.image);
                createPinPreviewFromForm();
            });
        });
        // If bookmarklet submit
        if (pinFromUrl) {
            $('#pin-form-image-upload').parent().parent().css('display', 'none');
            $('#pin-form-image-url').val(pinFromUrl);
            $('.navbar').css('display', 'none');
            modal.css({
                'margin-top': -35,
                'margin-left': -281
            });
        }
        // Submit pin on post click
        $('#pin-form-submit').click(function(e) {
            e.preventDefault();
            $(this).off('click');
            $(this).addClass('disabled');
            var data = {
                submitter: '/api/v1/user/'+currentUser.id+'/',
                description: $('#pin-form-description').val(),
                tags: cleanTags($('#pin-form-tags').val())
            };
            if (uploadedImage) data.image = '/api/v1/image/'+uploadedImage+'/';
            else data.url = $('#pin-form-image-url').val();
            var promise = postPinData(data);
            promise.success(function(pin) {
                if (pinFromUrl) return window.close();
                pin = renderTemplate('#pins-template', {pins: [pin]});
                $('#pins').prepend(pin);
                dismissModal(modal);
                uploadedImage = false;
            });
        });
        $('#pin-form-close').click(function() {
            if (pinFromUrl) return window.close();
            dismissModal(modal);
        });
        createPinPreviewFromForm();
    }
    // End View Functions


    // Start Init
    window.pinForm = function() {
        createPinForm();
    }

    if (getUrlParameter('pin-image-url')) {
        createPinForm();
    }
    // End Init
});

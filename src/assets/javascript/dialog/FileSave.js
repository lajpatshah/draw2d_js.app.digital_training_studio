FileSave = Class.extend({

    /**
     * @constructor
     *
     */
    init:function(fileHandler){
        this.currentFileHandle = fileHandler;
    },

    /**
     * @method
     *
     * Open the file picker and load the selected file.<br>
     *
     * @param {Function} successCallback callback method if the user select a file and the content is loaded
     * @param {Function} errorCallback method to call if any error happens
     *
     * @since 4.0.0
     */
    show: function(canvas)
    {
        var _this = this;

        $("#githubSaveFileDialog .githubFileName").val(_this.currentFileHandle.title);

        $('#githubSaveFileDialog').on('shown.bs.modal', function () {
            $(this).find('input:first').focus();
        });
        $("#githubSaveFileDialog").modal("show");

        // Button: Commit to GitHub
        //
        $("#githubSaveFileDialog .okButton").on("click", function () {
            var writer = new draw2d.io.json.Writer();
            writer.marshal(canvas, function (json, base64) {
                $.ajax({
                        url: conf.backend + "file_save.php",
                        method: "POST",
                        xhrFields: {
                            withCredentials: true
                        },
                        data:{
                            id:$("#githubSaveFileDialog .githubFileName").val(),
                            content:JSON.stringify(json, undefined, 2)
                        }
                    }
                ).done(function(){
                        $('#githubSaveFileDialog').modal('hide');
                });

            });
        });

    }

});
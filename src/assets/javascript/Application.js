/*jshint sub:true*/


/**
 * 
 * The **GraphicalEditor** is responsible for layout and dialog handling.
 * 
 * @author Andreas Herz
 */

var Application = Class.extend(
{

    /**
     * @constructor
     * 
     * @param {String} canvasId the id of the DOM element to use as paint container
     */
    init : function()
    {
        var _this = this;

        this.localStorage = [];
        try {
            if( 'localStorage' in window && window.localStorage !== null){
                this.localStorage = localStorage;
            }
        } catch(e) {

        }

        this.currentFileHandle= {
            title: "Untitled"+conf.fileSuffix
        };
        this.palette = new Palette(this);
        this.view    = new View(this, "draw2dCanvas");
        this.loggedIn = false;

        $("#appLogin, #editorLogin").on("click", function(){_this.login();});
        $("#fileOpen, #editorFileOpen").on("click", function(){ _this.fileOpen(); });
        $("#fileNew").on("click", function(){_this.fileNew();});
        $("#fileSave, #editorFileSave").on("click", function(){ _this.fileSave();});
        $("#appHelp").on("click", function(){$("#leftTabStrip .gitbook").click();});
        $("#appAbout").on("click", function(){ $("#leftTabStrip .about").click();});


        // First check if a valid token is inside the local storage
        //
        this.autoLogin();

        /*
         * Replace all SVG images with inline SVG
         */
        $('img.svg').each(function(){
            var $img = $(this);
            var imgURL = $img.attr('src');

            jQuery.get(imgURL, function(data) {
                // Get the SVG tag, ignore the rest
                var $svg = $(data).find('svg');
                // Remove any invalid XML tags as per http://validator.w3.org
                $svg = $svg.removeAttr('xmlns:a');
                // Replace image with new SVG
                $img.replaceWith($svg);
            }, 'xml');

        });

   //     $("#folder_tab a").click();
    },


    login:function()
    {
        var _this = this;
        // store the current document and visible tab pane.
        // This will be restored after the login has been done
        //
        var id= $("#leftTabStrip .active").attr("id");
        this.localStorage["pane"]=id;
        var writer = new draw2d.io.json.Writer();
        writer.marshal(this.view, function (json, base64) {
            _this.localStorage["json"]=JSON.stringify(json, undefined,2);
            window.location.href=conf.backend+"oauth2.php";
        });
    },



    dump:function()
    {
        var writer = new draw2d.io.json.Writer();
        writer.marshal(this.view, function (json) {
            console.log(JSON.stringify(json, undefined,2));
        });
    },

    getParam: function( name )
    {
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( window.location.href );

        // the param isn'T part of the normal URL pattern...
        //
        if( results === null ) {
            // maybe it is part in the hash.
            //
            regexS = "[\\#]"+name+"=([^&#]*)";
            regex = new RegExp( regexS );
            results = regex.exec( window.location.hash );
            if( results === null ) {
                return null;
            }
        }

        return results[1];
    },

    fileNew: function(shapeTemplate)
    {
        this.view.clear();
        $("#edit_tab a").click();
        this.currentFileHandle = {
            title: "Untitled"+conf.fileSuffix
        };
        if(shapeTemplate){
            var reader = new draw2d.io.json.Reader();
            reader.unmarshal(this.view, shapeTemplate);
        }
    },


    fileSave: function()
    {
        if(this.loggedIn!==true){
            this.loginFirstMessage();
            return;
        }

        new FileSave(this.currentFileHandle).show(this.view);
    },


    fileOpen: function()
    {
        if(this.loggedIn!==true){
            this.loginFirstMessage();
            return;
        }

        $("#leftTabStrip .edit").click();
        new FileOpen(this.currentFileHandle).show(

            // success callback
            $.proxy(function(fileData){
                try{
                    this.view.clear();
                    var reader = new draw2d.io.json.Reader();
                    reader.unmarshal(this.view, fileData);
                    this.view.getCommandStack().markSaveLocation();
                }
                catch(e){
                    this.view.reset();
                }
            },this));
    },


    autoLogin:function()
    {

        var _this = this;
        $.ajax({
            url:conf.backend +"isLoggedIn.php" ,
            xhrFields: {
                withCredentials: true
             },
            success:function(data){
                _this.setLoginStatus(data==="true");
            },
            error:function(){
                _this.setLoginStatus(false);
            }
        });
    },

    loginFirstMessage:function()
    {
        $("#appLogin").addClass("shake");
        window.setTimeout(function(){
            $("#appLogin").removeClass("shake");
        },500);
        $.bootstrapGrowl("You must first sign in to use this functionality", {
            type: 'danger',
            align: 'center',
            width: 'auto',
            allow_dismiss: false
        });
    },

    setLoginStatus:function(isLoggedIn)
    {
        var _this = this;
        this.loggedIn = isLoggedIn;
        if (this.loggedIn) {
            $(".notLoggedIn").removeClass("notLoggedIn");
            $("#editorgroup_login").hide();
            $("#editorgroup_fileoperations").show();

        }
        else{
            $(".notLoggedIn").addClass("notLoggedIn");
            $("#editorgroup_login").show();
            $("#editorgroup_fileoperations").hide();
        }

        var id = this.localStorage["pane"];
        if(id){
            this.localStorage.removeItem("pane");
            window.setTimeout(function(){
                $("#"+id+" a").click();
                var json = this.localStorage["json"];
                _this.localStorage.removeItem("json");
                if(json){
                    console.log(json);
                    window.setTimeout(function(){
                        _this.fileNew(json);
                    },200);
                }
            },100);
        }
    }
});

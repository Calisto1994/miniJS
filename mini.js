/*
---------------------------------------------------------------------------
-                   Eric Freiberg's miniJS framework                      -
---------------------------------------------------------------------------
-                 A lightweight alternative to jQuery                     -
---------------------------------------------------------------------------
*/
/* PUBLISHED UNDER THE CONDITIONS OF THE GNU LESSER GENERAL PUBLIC LICENSE (LGPL) v2.1 */
/* See: https://www.gnu.org/licenses/lgpl-3.0                                          */

var version_miniJS = "v0.2";


var moveObj = null;
var offset = [0, 0];
var movable = false;
var WinID = 0; // window ID, needed for e.g. closing
var maxZ = 250; // zIndex for windows and window focussing
var menuID = 0; // will be used to store context menu functions;

document.addEventListener("DOMContentLoaded", function () { // load necessary styles for e.g. windows, window buttons etc
    var style = "\n\
    .window .titlebar {\n\
        white-space: pre;\n\
        text-overflow: ellipsis;\n\
        overflow: hidden;\n\
        font-family: Arial, Helvetica, sans serif;\n\
        text-align: {align}\n\
    }\n\
    .wbtns {\n\
        float: right;\n\
        text-decoration: none;\n\
        font-weight: bolder;\n\
        font-family: Arial, Helvetica, sans serif;\n\
    }\n\
    .wbtns a {\n\
        font-size: 18px;\n\
        color: #000000;\n\
        margin-left: 2px; margin-right: 2px;\n\
        background-color: rgba(255, 255, 255, 0.2);\n\
        border-radius: 25px;\n\
    }\n\
    .wbtns .ext {\n\
        color: #000000;\n\
    }\n\
    .wbtns .min {\n\
        color: #000000;\n\
    }\n\
    .wbtns .max {\n\
        color: #000000;\n\
    }\n\
    .wbtns .close {\n\
        color: #000000;\n\
    }\n\
    .wbtns .close:hover {\n\
        filter: drop-shadow(0px 0px 5px white);\n\
        color: #ff0000;\n\
    }\n\
    .wbtns .max:hover {\n\
        filter: drop-shadow(0px 0px 5px white);\n\
        color: #00e3ff;\n\
    }\n\
    .wbtns .min:hover {\n\
        filter: drop-shadow(0px 0px 5px white);\n\
        color: #00ff00;\n\
    }\
    .wbtns .ext:hover {\n\
        filter: drop-shadow(0px 0px 5px white);\n\
        color: #ffff00;\n\
    }\
    .minijs_contextmenu {\n\
        filter: drop-shadow(0px 0px 5px black);\n\
        background-color: rgba(144, 144, 144, 0.5);\n\
        backdrop-filter: blur(5px);\ņ\
    }\n\
    .minijs_contextmenu a {\n\
        text-decoration: none;\n\
        color: #000000;\n\
        display: block;\n\
        border: 1px solid black;\n\
    }\n\
    .minijs_contextmenu a:hover {\n\
        color: #ff0000;\n\
        background-color: #fefefe;\n\
    }\n\
    .minijs_contextmenu li {\n\
        list-style-type: none;\n\
    }";
    
    var stylesheet = document.createElement("style");
    stylesheet.innerHTML = style;
    document.head.appendChild(stylesheet);
})

document.addEventListener("mousemove", function (event) {
    if (moveObj) {
        event.preventDefault();
        if (moveObj.oldwidth) {}
        else {
            moveObj.style.left = (event.clientX + offset[0]) + "px";
            moveObj.style.top = (event.clientY + offset[1]) + "px";
        }
    }
});

document.addEventListener("mousedown", function (event) {
    if ($(".minijs_contextmenu")) {
        var x = $("body").querySelectorAll(".minijs_contextmenu");
        for (let i = 0; i < x.length; i++) {
            $(x[i]).removeObj();
        }
        menuID = 0;
    }
});

// event listener to re-group minimized windows so they'll stay available.
var timeOutz;
window.addEventListener("resize", function () {
    this.clearTimeout(timeOutz);
    timeOutz = this.setTimeout(function() {
        miniJS.regroupMinimized();
    }, 200);
})

/* -------------------------------------------------------------------------------------------------------------------- */
/* --------------------------Main Selector Area------------------------------------------------------------------------ */
/* -------------------------------------------------------------------------------------------------------------------- */

function $ (...params) { // selector short function. Like jQuery.
    return(miniJS.selectObj(...params));
}
/* -------------------------------------------------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------- */

var miniJS = {
    selectObj: function (selector) {
        if (typeof(selector) == "object") var rObj = selector;
        else var rObj = document.querySelector(selector);    
        if (!rObj)  // selector didn't work. Cancel.
            return(0);
        /* declare an object (e.g. div) as movable with the mouse. */
        rObj.makeMovableObj = function () {
            rObj.style.position = "fixed";
            rObj.addEventListener("mousedown", function (e) {
                if (e.button == 0) { // only left mouse button
                    e.preventDefault();
                    offset = [
                        rObj.offsetLeft - e.clientX,
                        rObj.offsetTop - e.clientY
                    ];
                    moveObj = rObj;
                }
            }, true);
            document.addEventListener("mouseup", function (e) {
                moveObj = null;
            });
        }
        /* declare an objects parent (e.g. div) as movable with the mouse using the child. consider the child as a window titlebar. That might explain why this can be useful. */
        rObj.makeParentMovableObj = function () {
            rObj.parentNode.style.position = "fixed";
            rObj.addEventListener("mousedown", function (e) {
                if (e.button == 0) { // only left mouse button
                    e.preventDefault();
                    offset = [
                        rObj.parentNode.offsetLeft - e.clientX,
                        rObj.parentNode.offsetTop - e.clientY
                    ];
                    moveObj = rObj.parentNode;
                }
            }, true);
            document.addEventListener("mouseup", function (e) {
                moveObj = null;
            });
        }
        rObj.makeParentMovableWindow = function () {
            rObj.makeParentMovableObj(this); // the titlebar should be able to move the window, too.
            rObj.parentNode.style.position = "fixed";
            rObj.parentNode.addEventListener("mousedown", function (e) {
                if (e.button == 0 && e.shiftKey) { // only left mouse button, when shift is pressed
                    e.preventDefault();
                    offset = [
                        rObj.parentNode.offsetLeft - e.clientX,
                        rObj.parentNode.offsetTop - e.clientY
                    ];
                    moveObj = rObj.parentNode;
                }
            }, true);
            document.addEventListener("mouseup", function (e) {
                moveObj = null;
            });
        }
        /* Quickly go to top without animation */
        rObj.scrollToTop = function () {
            rObj.scrollTo(0, 0);
        }
        /* Slowly go to top with animation */
        rObj.gotoTop = function () {
            rObj.scrollTo({top: 0, left: 0, behavior: "smooth"});
        }
        /* remove an element */
        rObj.removeObj = function () {
            rObj.parentNode.removeChild(rObj);
        }
    
        rObj.addWindow = function (params) {
            if (!params) params = {};
            if (!params.left) params.left = "200px";
            if (!params.top) params.top = "0px";
            if (!params.width) params.width = "480px";
            if (!params.height) params.height = "320px";
            if (!params.tcolor) params.tcolor = "rgba(0, 255, 255, 0.5)"; // titlebar color
            if (!params.ttcolor) params.tcolor = "rgba(0, 255, 255, 0.5)"; // titlebar text color
            if (!params.bgcolor) params.bgcolor = "rgba(144, 144, 144, 1)";
            // In order to set a titlebar color, a titlebar text color MUST be provided!
    
            var x = document.createElement("div");
            x.classList.add("window");
            x.style.position = "absolute";
            x.style.top = params.top;
            x.style.left = params.left;
            x.style.width = params.width;
            x.style.height = params.height;
            x.style.zIndex = maxZ;
            x.extMenu = params.extMenu;
            x.id = "window" + WinID;
            rObj.appendChild(x);
            
            var y = document.createElement("div");
            y.classList.add("titlebar");
            y.style.position = "sticky";
            y.style.top = "0px";
            y.style.left = "0px";
            y.style.width = "100%";
            y.style.height = "36px";
            y.style.userSelect = "none";
            y.style.webkitUserSelect = "none";
            y.style.backgroundColor = params.tcolor;
            x.appendChild(y);
        
            var z = document.createElement("div");
            z.classList.add("content");
            z.style.position = "relative";
            z.style.top = "0px";
            z.style.left = "0px";
            y.style.fontSize = "16px"; // make sure it won't overlay the content
            z.style.width = "100%";
            z.style.height = "calc(100% - 36px)"
            z.style.backgroundColor = params.bgcolor;
            x.appendChild(z);
    
            // Apply the style to make the window look fine
            z.style.setProperty("overflow", "auto");
            x.style.setProperty("box-sizing", "border-box");
            y.style.setProperty("box-sizing", "border-box");
            z.style.setProperty("box-sizing", "border-box");
            y.style.setProperty("padding", "10px");
            z.style.setProperty("padding-left", "10px");
            z.style.setProperty("padding-right", "10px");
            z.style.setProperty("padding-bottom", "20px"); // because of border radius;
    
            x.style.setProperty("backdrop-filter", "blur(5px)");
            x.style.setProperty("-webkit-backdrop-filter", "blur(5px)");
            x.style.setProperty("filter", "drop-shadow(5px 5px 15px black)");
            x.style.setProperty("border-radius", "25px");
            x.style.setProperty("min-width", "320px");
            x.style.setProperty("min-height", "240px");
            y.style.setProperty("border-radius", "25px 25px 0px 0px");
            z.style.setProperty("border-radius", "0px 0px 25px 25px");
            y.style.setProperty("color", params.ttcolor);

            var buttons = "";
            if (x.extMenu) // only if an external menu function was provided within the functions arguments
                buttons += "<a class='ext' onclick='miniJS.extMenu(" + WinID + ")'>⊛</a>"
            buttons += "<a class='min' onclick='miniJS.minWindow(" + WinID + ")'>⊝</a>"
            buttons += "<a class='max' onclick='miniJS.maxWindow(" + WinID + ")'>⊕</a>"
            buttons += "<a class='close' onclick='miniJS.closeWindow(" + WinID + ")'>⊗</a>"

            y.innerHTML += "<span class='wbtns'>" + buttons + "</span>";
            if (params.content)
                z.innerHTML += params.content;
                if (params.title) {
                    if (typeof(params.title) == "object") { // allow title to be dependent on something else, e.g. an element
                        if (params.title.element)
                            y.innerHTML += z.querySelector(params.title.element).innerHTML;
                    } else {
                        y.innerHTML += params.title;    
                    }
                }
            // Make resizable
            x.style.setProperty("overflow", "hidden");
            x.style.setProperty("resize", "both");
            // Set to top.
            miniJS.setWindowFocus(y);
    
            $(y).makeParentMovableWindow();
            x.addEventListener("mousedown", function () {
                miniJS.setWindowFocus(y);
            }, true);
            WinID++; maxZ++;
            return(WinID - 1); // return current window ID
        }
    
        rObj.URLWindow = function (addr, WindowSettings) { // loads a content page, e.g. pages/somepage.html and generates a window which contends it
            if (!WindowSettings) WindowSettings = {}; // no settings specified.
            var xhttp = new XMLHttpRequest;
            xhttp.onreadystatechange = function () {
                if (xhttp.readyState == 4 && xhttp.status == 200) {
                    var rObjOptions = {content: this.responseText};
                    rObjOptions = Object.assign({}, rObjOptions, WindowSettings);
                    rObj.addWindow(rObjOptions);
                }
            };
            xhttp.open("GET", addr, true);
            xhttp.send();
        }
    
        rObj.loadContent = function (addr) {    // loads a page into a specified content area using AJAX technology
            var xhttp = new XMLHttpRequest;
            xhttp.onreadystatechange = function () {
                if (xhttp.readyState == 4 && xhttp.status == 200) {
                    rObj.innerHTML = this.responseText;
                }
            }
            xhttp.open("GET", addr, true);
            xhttp.send();
        }
    
        rObj.initTaskbar = function () {
            // TODO: Add taskbar init process
        }
    
        rObj.closeAllWindows = function () {
            var x = rObj.querySelectorAll(".window");
            for (let i = 0; i < x.length; i++) {
                $(x[i]).removeObj();
            }
            miniJS.resetmaxZ();
        }

        rObj.windowAt = function (left, top) {
            var allWindows = rObj.querySelectorAll(".window");
            for (let i = 0; i < allWindows.length; i++) {
                if (allWindows[i].minimized) {
                    if (allWindows[i].style.left == left.toString() + "px" && allWindows[i].style.top == "calc(100% - " + top + "px)") {
                        return(true);
                    }
                }
            }
            return(false);
        }
    
        return(rObj);
    },

    setWindowFocus: function (objName) {
        miniJS.resetmaxZ();
        if (maxZ == objName.parentNode.style.zIndex) {
            // do nothing. This window is already on top.
        } else {
            maxZ++;
            objName.parentNode.style.zIndex = maxZ; // focus the selected window
        }
    },

    closeWindow: function (windowID) {
        $("#window" + windowID).removeObj();
        var x = $("body").querySelectorAll(".window");
        var y = 0;
        if (x.length == 0) { maxZ = 250; }
        else {
            miniJS.resetmaxZ();
        }
    },

    resetmaxZ: function () {
        var x = $("body").querySelectorAll("#window");
        var y = 0;
        if (x.length > 0) {
            for (let i = 0; i < x.length; i++) { // get the greatest zIndex
                if (x[i].style.zIndex > y) {
                    y = x[i].style.zIndex;
                }
            } 
            maxZ = y; // and apply it to maxZ
        }
    },

    maxWindow: function (windowID) {
        if ($("#window" + windowID).maximized) {
            $("#window" + windowID).style.setProperty("transition", "width 0.5s, height 0.5s, top 0.5s, left 0.5s"); // animate.
            $("#window" + windowID).style.width = $("#window" + windowID).oldwidth;
            $("#window" + windowID).style.height = $("#window" + windowID).oldheight;
            $("#window" + windowID).style.top = $("#window" + windowID).oldtop;
            $("#window" + windowID).style.left = $("#window" + windowID).oldleft;
            $("#window" + windowID).style.resize = "both";
            // restore border radius
            $("#window" + windowID).style.setProperty("border-radius", "25px");
            $("#window" + windowID).querySelector(".titlebar").style.setProperty("border-radius", "25px 25px 0px 0px");
            $("#window" + windowID).querySelector(".content").style.setProperty("border-radius", "0px 0px 25px 25px");
    
            $("#window" + windowID).oldwidth = undefined; // unset.
            $("#window" + windowID).maximized = undefined;
            $("#window" + windowID).querySelector("a.max").innerHTML = "⊕"; // Put maximize symbol in place
            setTimeout(function () { $("#window" + windowID).style.setProperty("transition", ""); }, 700); // stop animation after 700ms
        }
        else {
            if ($("#window" + windowID).minimized) {
                miniJS.minWindow(windowID);
            }
            // save old values
            $("#window" + windowID).oldwidth = $("#window" + windowID).style.width;
            $("#window" + windowID).oldheight = $("#window" + windowID).style.height;
            $("#window" + windowID).oldleft = $("#window" + windowID).style.left;
            $("#window" + windowID).oldtop = $("#window" + windowID).style.top;
            $("#window" + windowID).maximized = "true";
    
            // maximize
            $("#window" + windowID).style.setProperty("transition", "width 0.5s, height 0.5s, top 0.5s, left 0.5s"); // animate.
            $("#window" + windowID).style.top = "0px";
            $("#window" + windowID).style.left = "0px";
            $("#window" + windowID).style.width = "100%";
            $("#window" + windowID).style.height = "100%";
            $("#window" + windowID).style.resize = "none";
            // remove border radius
            $("#window" + windowID).style.setProperty("border-radius", "0px");
            $("#window" + windowID).querySelector(".titlebar").style.setProperty("border-radius", "0px");
            $("#window" + windowID).querySelector(".content").style.setProperty("border-radius", "0px");
            $("#window" + windowID).querySelector("a.max").innerHTML = "⊙"; // Put restore symbol in place
            setTimeout(function () { $("#window" + windowID).style.setProperty("transition", ""); }, 700); // stop animation after 700ms
        }
    },

    minWindow: function (windowID) {
        // first, find out where to place the new window; since it's a nested loop, break out of it by using a trick (boolean value)
        var minLeft = 0;
        var minTop = 36;
        var breaknest = false;
        for (let y = 36; y < (window.innerHeight - 36); y = y + 36) {
            for (let i = 0; i < (window.innerWidth - 200); i = i + 200) {
                if (!$($("#window" + windowID).parentNode).windowAt(i, y)) {
                    minLeft = i;
                    minTop = y;
                    breaknest = true; break; 
                }
            }
            if (breaknest)
                break;
        }

        if ($("#window" + windowID).minimized) {
            $("#window" + windowID).style.setProperty("transition", "width 0.5s, height 0.5s, top 0.5s, left 0.5s"); // animate.
            $("#window" + windowID).style.width = $("#window" + windowID).oldwidth;
            $("#window" + windowID).style.height = $("#window" + windowID).oldheight;
            $("#window" + windowID).style.top = $("#window" + windowID).oldtop;
            $("#window" + windowID).style.left = $("#window" + windowID).oldleft;
            $("#window" + windowID).style.resize = "both";
            // restore border radius and minimal width
            $("#window" + windowID).style.setProperty("border-radius", "25px");
            $("#window" + windowID).querySelector(".titlebar").style.setProperty("border-radius", "25px 25px 0px 0px");
            $("#window" + windowID).querySelector(".content").style.setProperty("border-radius", "0px 0px 25px 25px");
            $("#window" + windowID).style.setProperty("min-width", "320px");
            $("#window" + windowID).style.setProperty("min-height", "240px");
            $("#window" + windowID).style.setProperty("filter", "drop-shadow(5px 5px 15px black)");
            $("#window" + windowID).style.setProperty("border", "");
    
            $("#window" + windowID).oldwidth = undefined; // unset.
            $("#window" + windowID).minimized = undefined; // unset.
            $("#window" + windowID).querySelector("a.min").innerHTML = "⊖"; // Put minimize symbol in place
            setTimeout(function () { $("#window" + windowID).style.setProperty("transition", ""); }, 700); // stop animation after 700ms
        }
        else {
            // save old values
            if ($("#window" + windowID).maximized) {
                miniJS.maxWindow(windowID);
            }
            $("#window" + windowID).oldwidth = $("#window" + windowID).style.width;
            $("#window" + windowID).oldheight = $("#window" + windowID).style.height;
            $("#window" + windowID).oldleft = $("#window" + windowID).style.left;
            $("#window" + windowID).oldtop = $("#window" + windowID).style.top;
            $("#window" + windowID).minimized = "true";
    
            // minimize
            $("#window" + windowID).style.setProperty("transition", "width 0.5s, height 0.5s, top 0.5s, left 0.5s"); // animate.
            $("#window" + windowID).style.setProperty("min-width", "");
            $("#window" + windowID).style.setProperty("min-height", "");
            $("#window" + windowID).style.top = "calc(100% - " + minTop + "px)";
            $("#window" + windowID).style.left = minLeft + "px";
            $("#window" + windowID).style.width = "200px";
            $("#window" + windowID).style.height = "36px";
            $("#window" + windowID).style.resize = "none";
            $("#window" + windowID).style.setProperty("filter", "");
            $("#window" + windowID).style.setProperty("border", "1px solid black");
            // remove border radius
            $("#window" + windowID).style.setProperty("border-radius", "0px");
            $("#window" + windowID).querySelector(".titlebar").style.setProperty("border-radius", "0px");
            $("#window" + windowID).querySelector(".content").style.setProperty("border-radius", "0px");
            $("#window" + windowID).querySelector("a.min").innerHTML = "⊙"; // Put restore symbol in place
            setTimeout(function () { $("#window" + windowID).style.setProperty("transition", ""); }, 700); // stop animation after 700ms
        }
    },

    extMenu: function (windowID) { // query the external function
        $("#window" + windowID).extMenu(windowID);
    },

    replaceArray: function (string, searchValues, replaceValues) {
        var result = string;
        for (let i = 0; i < searchValues.length; i++) {
            result = result.replace(searchValues[i], replaceValues[i]);
        }
        return result;
    },

    regroupMinimized: function () {
        var yar = [];
        for (let y = 36; y < (window.innerHeight - 36); y = y + 36) {
            for (let i = 0; i < (window.innerWidth - 200); i = i + 200) {
                yar.push([y, i]);
            }
        }

        var count = 0;
        var x = $("body").querySelectorAll(".window");
        for (let i = 0; i < x.length; i++) {
            if (x[i].minimized) {
                x[i].style.top = "calc(100% - " + yar[count][0] + "px)";
                x[i].style.left = yar[count][1] + "px";
                count++;
            }
        }
    },

    version: function () {
        console.log("miniJS JavaScript framework");
        console.log("Version", version_miniJS)
    },

    
    Randomizer: function (min, max) {
        var x = Math.random();
        x = Math.floor(x * (max - min + 1) + min);
        return x;
    },

    contextMenu: function (elements) {
        var cMenu = document.createElement("div");
        cMenu.classList.add("minijs_contextmenu");
        cMenu.id = "menu" + (menuID += 1);
        cMenu.style.setProperty("position", "fixed");
        cMenu.style.setProperty("left", (window.event.clientX - 10) + "px");
        cMenu.style.setProperty("top", window.event.clientY + "px");
        cMenu.style.setProperty("z-index", 900);
        cMenu.style.setProperty("background-color", "rgba(255, 255, 255, 0.7)")
        cMenu.style.setProperty("user-select", "none");
        cMenu.style.setProperty("-moz-user-select", "none");
        cMenu.style.setProperty("-webkit-user-select", "none");
        cMenu.oncontextmenu = (e) => {
            e.preventDefault();
        };

        cMenu.functions = []; // placeholder for menu functions
        cMenu.subMenu = []; // placeholder for additional menus
        cMenu.subEvnt = false; // placeholder for menu events to block sub menus to open multiple times
                            // (and to make sure only *one* sub-menu will be opened)
        var subCount = 0;

        for (let i = 0; i < Object.keys(elements).length; i++) {
            if ("object" == typeof Object.values(elements)[i]) {
                cMenu.subMenu[subCount] = Object.values(elements)[i];
                cMenu.subEvnt[subCount] = false;
                cMenu.innerHTML += "<li><a onmouseleave='miniJS.subMenu(" + menuID + "," + subCount + ");'>" + Object.keys(elements)[i] + "...</a></li>";
                subCount++;
            } else {
                cMenu.innerHTML += "<li><a onmousedown='miniJS.contextFunction(" + menuID + "," + i + ");'>" + Object.keys(elements)[i] + "</a></li>";
                cMenu.functions[i] = Object.values(elements)[i];
            }
        }
        $("body").appendChild(cMenu);
        if (window.event.clientY + cMenu.offsetHeight > window.innerHeight) {
            cMenu.style.setProperty("top", null);
            cMenu.style.setProperty("bottom", "0px");
        }
        return(menuID);
    },

    contextFunction: function (menu, id) {
        var cMenu = $("#menu" + menu); // get the proper context menu
        if (window.event.which != 1)
            return;
        cMenu.functions[id]();
    },

    removeSubMenues: function (menu) { // if another sub-menu is opened, close the one that was open previously and all sub-menus opened by it
        var cMenu = $("#menu" + menu);
        if (cMenu.subEvnt) {
            this.removeSubMenues(cMenu.subEvnt);
            $("#menu" + cMenu.subEvnt).removeObj();
        }
    },

    subMenu: function (menu, id) { // manage multi-level menus
        var cMenu = $("#menu" + menu);
        if (window.event.clientX >= cMenu.offsetLeft + cMenu.offsetWidth && window.event.clientY > cMenu.offsetTop && window.event.clientY < (cMenu.offsetTop + cMenu.offsetHeight)) { // only if the user leaves to the right side of the menu.
            if (cMenu.subEvnt)
                this.removeSubMenues(menu);
            cMenu.subEvnt = this.contextMenu(cMenu.subMenu[id]);
            $("#menu" + cMenu.subEvnt).style.left = (cMenu.offsetLeft + cMenu.offsetWidth) + "px";
        }
        if (window.event.clientX < cMenu.offsetLeft && window.event.clientY > cMenu.offsetTop && window.event.clientY < (cMenu.offsetTop + cMenu.offsetHeight)) { // only if the user leaves to the left side of the menu.
            if (cMenu.subEvnt)
                this.removeSubMenues(menu);
            cMenu.subEvnt = this.contextMenu(cMenu.subMenu[id]);
            $("#menu" + cMenu.subEvnt).style.left = "";
            $("#menu" + cMenu.subEvnt).style.right = (window.innerWidth - cMenu.offsetLeft) + "px";
        }
    }
};
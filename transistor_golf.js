function make_draggable(event){
    var svg = event.target;
    svg.addEventListener("mousedown", start_drag);
    svg.addEventListener("contextmenu", start_drag);
    svg.addEventListener("mousemove", drag);
    svg.addEventListener("mouseup", end_drag);
    svg.addEventListener("mouseleave", end_drag);

    var selected_element = false;
    var offset;

    function start_drag(event){
        event.preventDefault();
        if (event.target.classList.contains("draggable")){
            if (event.button == 0){
                selected_element = event.target;
                var coord = get_mouse_position(event);
                offset = {
                            x: coord.x - selected_element.getAttributeNS(null, "x"),
                            y: coord.y - selected_element.getAttributeNS(null, "y")
                         };          
            }else if(event.button == 1){
                target = event.target;
                var mid = get_rect_mid(target);
                /*
                var rect_x = target.getAttributeNS(null, "x");
                var rect_y = target.getAttributeNS(null, "y");
                target.setAttributeNS(null, "x", rect_x - mid.x);
                target.setAttributeNS(null, "y", rect_y - mid.y);
                var w = parseFloat(target.getAttributeNS(null, "width")) / 2;
                var h = parseFloat(target.getAttributeNS(null, "height")) / 2;
                */
                var rot = parseInt(target.getAttributeNS(null, "rotation")) || 0;
                rot = (rot + 90) % 360;
                target.setAttributeNS(null, "rotation", rot);
                //target.setAttributeNS(null, "transform-origin", "50% 50%");
                target.setAttributeNS(null, "transform", `rotate(${rot} ${mid.x} ${mid.y})`);
                //target.setAttributeNS(null, "x", rect_x);
                //target.setAttributeNS(null, "y", rect_y);
                set_message(`${target.getAttributeNS(null, "x")} ${target.getAttributeNS(null, "y")}`);
            }
        }
    }

    function drag(event){
        if (selected_element){
            event.preventDefault();
            var coord = get_mouse_position(event);
            selected_element.setAttributeNS(null, "x", coord.x - offset.x);
            selected_element.setAttributeNS(null, "y", coord.y - offset.y);
            var rot = selected_element.getAttributeNS(null, "rotation") || 0;
            var mid = get_rect_mid(selected_element);
            //selected_element.setAttributeNS(null, "transform-origin", "50% 50%");
            selected_element.setAttributeNS(null, "transform", `rotate(${rot} ${mid.x} ${mid.y})`);

        }
    }

    function end_drag(event){
        selected_element = false;
    }

    function get_mouse_position(event){
        var CTM = svg.getScreenCTM();
        return {
            x: (event.x - CTM.e) / CTM.a,
            y: (event.y - CTM.f) / CTM.d
        };
    }

    function get_rect_mid(rect){
        return  {
                    x: parseFloat(rect.getAttributeNS(null, "x")) + parseFloat(rect.getAttributeNS(null, "width"))/2,
                    y: parseFloat(rect.getAttributeNS(null, "y")) + parseFloat(rect.getAttributeNS(null, "height"))/2
                };
        /*
        return  {
                    x: parseFloat(parseFloat(rect.getAttributeNS(null, "x"))),
                    y: parseFloat(parseFloat(rect.getAttributeNS(null, "y"))),
                };
        */
    }
}

function set_message(message){
    document.getElementById("message").value = message;
}

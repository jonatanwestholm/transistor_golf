function make_draggable(event){
    var svg = event.target;
    svg.addEventListener("mousedown", start_drag);
    svg.addEventListener("contextmenu", start_drag);
    svg.addEventListener("mousemove", drag);
    svg.addEventListener("mouseup", end_drag);
    svg.addEventListener("mouseleave", end_drag);

    var selected_element = false;
    var offset;

    spawn();

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
                var rot = parseInt(target.getAttributeNS(null, "rotation")) || 0;
                rot = (rot + 90) % 360;
                target.setAttributeNS(null, "rotation", rot);
                target.setAttributeNS(null, "transform", `rotate(${rot} ${mid.x} ${mid.y})`);
                set_message(`${target.getAttributeNS(null, "x")} ${target.getAttributeNS(null, "y")}`);
            }
        }
        if(selected_element && !(selected_element.getAttributeNS(null, "nontrivial"))){
            spawn();
            selected_element.setAttributeNS(null, "nontrivial", "true");
        }
    }

    function drag(event){
        if (selected_element){
            event.preventDefault();
            var coord = get_mouse_position(event);
            var rot = selected_element.getAttributeNS(null, "rotation") || 0;
            if (rot % 180 == 0){
                selected_element.setAttributeNS(null, "x", parseInt((coord.x - offset.x + 1)/4)*4);
                selected_element.setAttributeNS(null, "y", parseInt((coord.y - offset.y + 1)/4)*4);
            }else{            
                selected_element.setAttributeNS(null, "x", parseInt((coord.x - offset.x + 1)/4)*4);
                selected_element.setAttributeNS(null, "y", parseInt((coord.y - offset.y + 1)/4)*4);
            }
            var mid = get_rect_mid(selected_element);
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
                    x: parseFloat(rect.getAttributeNS(null, "x")), // + parseFloat(rect.getAttributeNS(null, "width"))/2,
                    y: parseFloat(rect.getAttributeNS(null, "y")) // + parseFloat(rect.getAttributeNS(null, "height"))/2
                };
        /*
        return  {
                    x: parseFloat(parseFloat(rect.getAttributeNS(null, "x"))),
                    y: parseFloat(parseFloat(rect.getAttributeNS(null, "y"))),
                };
        */
    }
}

function spawn(){
    const svgbox = document.getElementById("svgbox");
    //const svgbox = document.getElementById("otherbox");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
    //const rect = document.createElement("box");
    //rect.setAttributeNS(null, "class", "draggable");
    //rect.setAttributeNS(null, "x", 10);
    //rect.setAttributeNS(null, "y", 10);
    //rect.classList.add("transistor");
    rect.setAttributeNS(null, "class", "draggable transistor");
    rect.setAttributeNS(null, "width", 12);
    rect.setAttributeNS(null, "height", 8);
    rect.setAttributeNS(null, "href", "transistor2.svg")
    //rect.setAttributeNS(null, "fill", "#007bff");
    svgbox.appendChild(rect);
}

function set_message(message){
    document.getElementById("message").value = message;
}

function make_lines(){
    const svgbox = document.getElementById("svgbox");
    //<line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />

    for (let i = 4; i < 300; i = i + 4){
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttributeNS(null, "x1", i);
        line.setAttributeNS(null, "y1", 0);
        line.setAttributeNS(null, "x2", i);
        line.setAttributeNS(null, "y2", 120);
        line.setAttributeNS(null, "style", "stroke:rgb(50, 50, 50);stroke-width:0.1");

        svgbox.appendChild(line);
    }

    for (let i = 4; i < 120; i = i + 4){
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttributeNS(null, "x1", 0);
        line.setAttributeNS(null, "y1", i);
        line.setAttributeNS(null, "x2", 300);
        line.setAttributeNS(null, "y2", i);
        line.setAttributeNS(null, "style", "stroke:rgb(50, 50, 50);stroke-width:0.1");

        svgbox.appendChild(line);
    }

}

make_lines();

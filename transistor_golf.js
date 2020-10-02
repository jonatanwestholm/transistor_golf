class Component{
    rotate90(){
        //rotation by 90 degrees
        this.rot = (this.rot + 1) % 4;
        this.x = this.x + 4;
    }

    move_to(x, y){
        this.x = parseInt(x / 4);
        this.y = parseInt(y / 4);
        this.moved = true;
    }
}

class Bar extends Component{
    constructor(id, elem){
        super();
        this.id = id;
        this.elem = elem;
        this.rot = 0;
        this.length = 5;
        this.x = 0;
        this.y = 4;
    }

    get_json_data(){
        return ["bar", 
               [this.x, this.y], 
               this.rot, 
               this.length];
    }

}

class Node extends Component{
    constructor(id, type_name, elem){
        super();
        this.id = id;
        this.elem = elem;
        this.type_name = type_name;
        this.rot = 0;
        this.x = 0;
        if(type_name == "supply"){
            this.y = 4;
        }else if(type_name == "ground"){
            this.y = 5;
        }else if(type_name == "input"){
            this.y = 6;
        }else if(type_name == "output"){
            this.y = 7;
        }else if(type_name == "isolator"){
            this.y = 8;
        }
    }

    get_json_data(){
        return [this.type_name,
               [this.x, this.y]];
    }
}

class Transistor extends Component{
    constructor(id, sign, elem){
        super();
        this.id = id;
        this.elem = elem;
        this.sign = sign;
        this.rot = 0;
        if(sign > 0){
            this.x = 0;
            this.y = 0;            
        }else{
            this.x = 0;
            this.y = 2;
        }
    }

    get_json_data(){
        const rot = this.rot;
        const x = this.x;
        const y = this.y;
        return ["transistor", 
                [x + G[rot][0], y + G[rot][1]], 
                [x + S[rot][0], y + S[rot][1]], 
                [x + D[rot][0], y + D[rot][1]], 
                this.sign];
    }

    /*
    get_id2xy(){
        const x = this.x;
        const y = this.y;
        const rot = this.rot;
        const gate_id = this.gate_id;
        const source_id = this.source_id;
        const drain_id = this.drain_id;

        return {gate_id:   [G[rot][0], G[rot][1]],
                source_id: [S[rot][0], S[rot][1]],
                drain_id:  [D[rot][0], D[rot][1]]};
    }

    get_clauses(){
        return [[-this.sign * this.gate_id, this.source_id, -this.drain_id], 
                [-this.sign * this.gate_id, -this.source_id, this.drain_id]];
    }
    */
}

const G = [[1, 0], [-1, 1], [-2, -1], [0, -2]];
const S = [[0, 1], [-2, 0], [-1, -2], [1, -1]];
const D = [[2, 1], [-2, 2], [-3, -2], [1, -3]];

function make_draggable(event){
    var svg = event.target;
    svg.addEventListener("mousedown", start_drag);
    svg.addEventListener("contextmenu", start_drag);
    svg.addEventListener("mousemove", drag);
    svg.addEventListener("mouseup", end_drag);
    svg.addEventListener("mouseleave", end_drag);

    var elem = false;
    var offsets;
    var click_x0y0 = false;
    var selected_blocks = false;
    var begin_drag = false;

    spawn("all");

    function start_drag(event){
        event.preventDefault();
        flush_highlighted();
        if (event.target.classList.contains("draggable")){
            if (event.button == 0){
                if(event.detail == 1){
                    // single click
                    elem = event.target;
                    id = elem.getAttributeNS(null, "id");
                    if(selected_blocks && blocks_include_id(selected_blocks, id)){
                        //we clicked on one of the selected block
                    }else{
                        // we clicked on a non-selected element
                        flush_selected_blocks();
                        selected_blocks = [{"elem": elem}];
                    }
                    begin_drag = true;
                    offsets = get_offsets(selected_blocks, event);
                }else if (event.detail == 2){
                    // double-click to highlight connected region
                    var coord = get_mouse_position(event);
                    var x_coord = parseInt(coord.x / 4);
                    var y_coord = parseInt(coord.y / 4);
                    //set_message(`double clicked on (${x_coord}, ${y_coord})`);
                    highlight_connected_region(x_coord, y_coord);
                }
            }else if(event.button == 1){
                target = event.target;
                var mid = get_rect_mid(target);
                var rot = parseInt(target.getAttributeNS(null, "rotation")) || 0;
                rot = (rot + 90) % 360;
                target.setAttributeNS(null, "rotation", rot);
                target.setAttributeNS(null, "transform", `rotate(${rot} ${mid.x + 2} ${mid.y + 2})`);
                id = target.getAttributeNS(null, "id");
                blocks[id].rotate90();
                //set_message(`${target.getAttributeNS(null, "x")} ${target.getAttributeNS(null, "y")}`);
            }
        }else{
            // we clicked outside of an element: select a box instead
            if (event.button == 0){
                //flush_dragbox_lines();
                flush_selected_blocks();
                selected_blocks = false;
                click_x0y0 = get_mouse_position(event);
                start_dragbox_lines(click_x0y0);
            }
        }

        if(elem && !(elem.getAttributeNS(null, "nontrivial"))){
            spawn(elem.getAttributeNS(null, "class"));
            elem.setAttributeNS(null, "nontrivial", "true");
            elem = false;
        }
    }

    function drag(event){
        if (selected_blocks && begin_drag){
            event.preventDefault();
            for(idx in selected_blocks){
                var block = selected_blocks[idx];
                var block_elem = block.elem;
                var coord = get_mouse_position(event);
                var rot = block_elem.getAttributeNS(null, "rotation") || 0;
                id = block_elem.getAttributeNS(null, "id");
                //block_elem.setAttributeNS(null, "x", parseInt((coord.x - offset.x + 2)/4)*4);
                //block_elem.setAttributeNS(null, "y", parseInt((coord.y - offset.y + 2)/4)*4);
                block_elem.setAttributeNS(null, "x", parseInt((coord.x - offsets[id].x + 2)/4)*4);
                block_elem.setAttributeNS(null, "y", parseInt((coord.y - offsets[id].y + 2)/4)*4);
                var mid = get_rect_mid(block_elem);
                block_elem.setAttributeNS(null, "transform", `rotate(${rot} ${mid.x} ${mid.y})`);                
            }
        }
        if(click_x0y0){
            //event.preventDefault();
            coord = get_mouse_position(event);
            update_dragbox_lines(coord);
        }
    }

    function end_drag(event){
        if (selected_blocks){
            event.preventDefault();
            for(idx in selected_blocks){
                var block = selected_blocks[idx];
                var block_elem = block.elem;
                id = block_elem.getAttributeNS(null, "id");
                x = block_elem.getAttributeNS(null, "x");
                y = block_elem.getAttributeNS(null, "y");
                if(x <= 40 && (120 - y) <= 40){
                    // dragged to recycle box
                    const svgbox = document.getElementById("svgbox");
                    svgbox.removeChild(block_elem);
                    delete blocks[id];
                }else{
                    blocks[id].move_to(x, y);
                }
            }
            // should maybe not end selected blocks here!
            flush_selected_blocks();
        }else if(click_x0y0){
            selected_blocks = get_selected_blocks(click_x0y0, get_mouse_position(event));
            highlight_selected_blocks(selected_blocks);
            flush_dragbox_lines();
            //console.log(selected_blocks);
            click_x0y0 = false;
        }
        begin_drag = false;
    }

    function get_mouse_position(event){
        var CTM = svg.getScreenCTM();
        return {
            x: (event.x - CTM.e) / CTM.a,
            y: (event.y - CTM.f) / CTM.d
        };
    }

    function flush_selected_blocks(){
        selected_blocks = false;
    }

    function get_rect_mid(rect){
        return  {
                    x: parseFloat(rect.getAttributeNS(null, "x")), // + parseFloat(rect.getAttributeNS(null, "width"))/2,
                    y: parseFloat(rect.getAttributeNS(null, "y")) // + parseFloat(rect.getAttributeNS(null, "height"))/2
                };
    }

    function get_offsets(blocks, event){
        var coord = get_mouse_position(event);
        offsets = new Map();
        for(idx in blocks){
            elem = blocks[idx].elem;
            id = elem.getAttributeNS(null, "id");
            offsets[id] = { x: coord.x - elem.getAttributeNS(null, "x"),
                            y: coord.y - elem.getAttributeNS(null, "y")};
        }
        return offsets;
    }

}

function spawn(elem_class){
    const svgbox = document.getElementById("svgbox");
    /*
    if(box_num == 1){
    }else{
        const svgbox = document.getElementById("svgbox2");        
    }*/
    //const svgbox = document.getElementById("otherbox");
    if (elem_class == "draggable transistor" || elem_class == "all"){
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
        //const rect = document.createElement("box");
        //rect.setAttributeNS(null, "class", "draggable");
        //rect.classList.add("transistor");
        rect.setAttributeNS(null, "class", "draggable transistor");
        rect.setAttributeNS(null, "title", "positive");
        rect.setAttributeNS(null, "width", 12);
        rect.setAttributeNS(null, "height", 8);
        rect.setAttributeNS(null, "x", 0);
        rect.setAttributeNS(null, "y", 0);
        rect.setAttributeNS(null, "href", "sprites/transistor_pos.svg")
        rect.setAttributeNS(null, "id", top_id);
        //rect.setAttributeNS(null, "position", "relative");
        //rect.setAttributeNS(null, "z-index", -1);
        //rect.setAttributeNS(null, "fill", "#007bff");    
        svgbox.appendChild(rect);
        blocks[top_id] = new Transistor(top_id, 1, rect);
        top_id = top_id + 1;
    }
    if (elem_class == "draggable neg transistor" || elem_class == "all"){
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
        //const rect = document.createElement("box");
        //rect.setAttributeNS(null, "class", "draggable");
        //rect.classList.add("transistor");
        rect.setAttributeNS(null, "class", "draggable neg transistor");
        rect.setAttributeNS(null, "width", 12);
        rect.setAttributeNS(null, "height", 8);
        rect.setAttributeNS(null, "x", 0);
        rect.setAttributeNS(null, "y", 8);
        //rect.setAttributeNS(null, "href", "transistor3.svg")
        rect.setAttributeNS(null, "href", "sprites/transistor_neg.svg")
        rect.setAttributeNS(null, "id", top_id);
        rect.setAttributeNS(null, "position", "relative");
        rect.setAttributeNS(null, "z-index", -1);
        //rect.setAttributeNS(null, "fill", "#007bff");
        svgbox.appendChild(rect);
        blocks[top_id] = new Transistor(top_id, -1, rect);
        top_id = top_id + 1;
    }
    if (elem_class == "draggable bar" || elem_class == "all"){
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
        //const rect = document.createElement("box");
        //rect.setAttributeNS(null, "class", "draggable");
        //rect.classList.add("transistor");
        rect.setAttributeNS(null, "class", "draggable bar");
        rect.setAttributeNS(null, "width", 20);
        rect.setAttributeNS(null, "height", 4);
        rect.setAttributeNS(null, "x", 0);
        rect.setAttributeNS(null, "y", 16);
        //rect.setAttributeNS(null, "href", "transistor3.svg")
        rect.setAttributeNS(null, "href", "sprites/bar.svg")
        rect.setAttributeNS(null, "id", top_id);
        rect.setAttributeNS(null, "z-index", 0);
        //rect.setAttributeNS(null, "fill", "#007bff");
        svgbox.appendChild(rect);
        blocks[top_id] = new Bar(top_id, rect);
        top_id = top_id + 1;
    }
    if (elem_class == "draggable vdd" || elem_class == "all"){
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
        //const rect = document.createElement("box");
        //rect.setAttributeNS(null, "class", "draggable");
        //rect.classList.add("transistor");
        rect.setAttributeNS(null, "class", "draggable vdd");
        rect.setAttributeNS(null, "width", 4);
        rect.setAttributeNS(null, "height", 4);
        rect.setAttributeNS(null, "x", 0);
        rect.setAttributeNS(null, "y", 20);
        //rect.setAttributeNS(null, "href", "transistor3.svg")
        rect.setAttributeNS(null, "href", "sprites/vdd.svg")
        rect.setAttributeNS(null, "id", top_id);
        rect.setAttributeNS(null, "position", "relative");
        rect.setAttributeNS(null, "z-index", 1);
        //rect.setAttributeNS(null, "fill", "#007bff");
        svgbox.appendChild(rect);
        blocks[top_id] = new Node(top_id, "supply", rect);
        top_id = top_id + 1;
    }
    if (elem_class == "draggable gnd" || elem_class == "all"){
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
        //const rect = document.createElement("box");
        //rect.setAttributeNS(null, "class", "draggable");
        //rect.classList.add("transistor");
        rect.setAttributeNS(null, "class", "draggable gnd");
        rect.setAttributeNS(null, "width", 4);
        rect.setAttributeNS(null, "height", 4);
        rect.setAttributeNS(null, "x", 0);
        rect.setAttributeNS(null, "y", 24);
        //rect.setAttributeNS(null, "href", "transistor3.svg")
        rect.setAttributeNS(null, "href", "sprites/gnd.svg")
        rect.setAttributeNS(null, "id", top_id);
        rect.setAttributeNS(null, "z-index", 1);
        //rect.setAttributeNS(null, "fill", "#007bff");
        svgbox.appendChild(rect);
        blocks[top_id] = new Node(top_id, "ground", rect);
        top_id = top_id + 1;
    }
    if (elem_class == "draggable x" || elem_class == "all"){
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
        //const rect = document.createElement("box");
        //rect.setAttributeNS(null, "class", "draggable");
        //rect.classList.add("transistor");
        rect.setAttributeNS(null, "class", "draggable x");
        rect.setAttributeNS(null, "title", "x");
        rect.setAttributeNS(null, "width", 4);
        rect.setAttributeNS(null, "height", 4);
        rect.setAttributeNS(null, "x", 0);
        rect.setAttributeNS(null, "y", 28);
        //rect.setAttributeNS(null, "href", "transistor3.svg")
        rect.setAttributeNS(null, "href", "sprites/x.svg")
        rect.setAttributeNS(null, "id", top_id);
        rect.setAttributeNS(null, "z-index", 1);
        //rect.setAttributeNS(null, "fill", "#007bff");
        svgbox.appendChild(rect);
        blocks[top_id] = new Node(top_id, "input", rect);
        top_id = top_id + 1;
    }
    if (elem_class == "draggable t" || elem_class == "all"){
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
        //const rect = document.createElement("box");
        //rect.setAttributeNS(null, "class", "draggable");
        //rect.classList.add("transistor");
        rect.setAttributeNS(null, "class", "draggable t");
        rect.setAttributeNS(null, "width", 4);
        rect.setAttributeNS(null, "height", 4);
        rect.setAttributeNS(null, "x", 0);
        rect.setAttributeNS(null, "y", 32);
        //rect.setAttributeNS(null, "href", "transistor3.svg")
        rect.setAttributeNS(null, "href", "sprites/t.svg")
        rect.setAttributeNS(null, "id", top_id);
        rect.setAttributeNS(null, "position", "relative");
        rect.setAttributeNS(null, "z-index", 1);        
        //rect.setAttributeNS(null, "fill", "#007bff");
        svgbox.appendChild(rect);
        blocks[top_id] = new Node(top_id, "output", rect);
        top_id = top_id + 1;
    }
    if (elem_class == "draggable isolator" || elem_class == "all"){
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
        //const rect = document.createElement("box");
        //rect.setAttributeNS(null, "class", "draggable");
        //rect.classList.add("transistor");
        rect.setAttributeNS(null, "class", "draggable isolator");
        rect.setAttributeNS(null, "width", 4);
        rect.setAttributeNS(null, "height", 4);
        rect.setAttributeNS(null, "x", 0);
        rect.setAttributeNS(null, "y", 36);
        //rect.setAttributeNS(null, "href", "transistor3.svg")
        rect.setAttributeNS(null, "href", "sprites/b.svg")
        rect.setAttributeNS(null, "id", top_id);
        rect.setAttributeNS(null, "position", "relative");
        rect.setAttributeNS(null, "z-index", 1);        
        //rect.setAttributeNS(null, "fill", "#007bff");
        svgbox.appendChild(rect);
        blocks[top_id] = new Node(top_id, "isolator", rect);
        top_id = top_id + 1;
    }
}


function httpPostAsync(url, callback, json_data)
{
    var xhr = new XMLHttpRequest();
    /*
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            parse_response(xmlHttp.responseText);
    }
    xmlHttp.open("POST", url, false); // false for synchronous 
    xmlHttp.send(null);
    */
    xhr.onreadystatechange = function() { 
        if (xhr.readyState == 4 && xhr.status == 200)
            callback(xhr.responseText);
    }

    xhr.open("POST", url, false);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    // send the collected data as JSON
    xhr.send(JSON.stringify(json_data));
}

function evaluate_circuit(){
    set_message("evaluating circuit...");
    //json_data = JSON.parse('{"text": "hello from json"}');
    var json_data = {};
    for (id in blocks){
        //console.log(blocks[id].id);
        if(blocks[id].moved || 0){
            json_data[id] = blocks[id].get_json_data();
        }
    }

    //console.log(json_data);
    //set_message("created json...");    
    //httpPostAsync('http://127.0.0.1:5000/ec', parse_response, json_data);
    httpPostAsync(get_address() + 'ec', parse_response, json_data);
    //set_message("sent json");
}

function get_address(){
    var radios = document.getElementsByName("server");
    var server_type;
    for (i in radios) {
      if (radios[i].checked) {
        server_type = radios[i].value;
        break;
      }
    }

    if(server_type == "standard"){
        return 'https://transistor-golf.ew.r.appspot.com/';
    }else if (server_type == "dev"){
        return 'http://127.0.0.1:5000/';
    }
}

function parse_response(response){
    response = JSON.parse(response);
    var resp;
    var message = "Feasible assignments:\n";
    for(id in response){
        resp = response[id];
        message += `x: ${resp['x']} t: ${resp['t']}\n`;
    }
    set_message(message);
}


function set_message(message){
    document.getElementById("message").value = message;
}


function get_selected_blocks(coord0, coord1){
    x0 = coord0.x / 4;
    x1 = coord1.x / 4;
    y0 = coord0.y / 4;
    y1 = coord1.y / 4;

    var selected = [];

    for(id in blocks){
        x = blocks[id].x;
        y = blocks[id].y;
        if((x0 - x)*(x - x1) >= 0 && (y0 - y)*(y - y1) >= 0){
            selected.push(blocks[id]);
        }
    }
    return selected;
}

function blocks_include_id(blocks, id){
    for(idx in blocks){
        if(id == blocks[idx].elem.getAttributeNS(null, "id")){
            return true;
        }
    }
    return false;
}

function start_dragbox_lines(click_x0y0){
    const svgbox = document.getElementById("svgbox");
    var line_name;
    var line_names = ["top", "bottom", "left", "right"];
    x = click_x0y0.x;
    y = click_x0y0.y;
    for(i in line_names){
        line_name = line_names[i];
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttributeNS(null, "x1", x);
        line.setAttributeNS(null, "y1", y);
        line.setAttributeNS(null, "x2", x);
        line.setAttributeNS(null, "y2", y);
        line.setAttributeNS(null, "style", "stroke:rgb(0, 0, 255);stroke-width:0.1");
        try{
            svgbox.removeChild(dragbox_lines[line_name]);
        }catch{
            //console.log(`no line to remove`);
        }
        svgbox.appendChild(line);
        dragbox_lines[line_name] = line;
    }
}

function update_dragbox_lines(coord){
    x = coord.x;
    y = coord.y;
    top_line = dragbox_lines["top"];
    top_line.setAttributeNS(null, "x2", x);
    bottom_line = dragbox_lines["bottom"];
    bottom_line.setAttributeNS(null, "x2", x);
    bottom_line.setAttributeNS(null, "y1", y);
    bottom_line.setAttributeNS(null, "y2", y);

    left_line = dragbox_lines["left"];
    left_line.setAttributeNS(null, "y2", y);
    right_line = dragbox_lines["right"];
    right_line.setAttributeNS(null, "y2", y);
    right_line.setAttributeNS(null, "x1", x);
    right_line.setAttributeNS(null, "x2", x);
}

function flush_dragbox_lines(){
    /*
    */
    const svgbox = document.getElementById("svgbox");
    line_names = ["top", "bottom", "left", "right"];
    for(i in line_names){
        line_name = line_names[i];
        line = dragbox_lines[line_name];
        try{
            svgbox.removeChild(line);
        }catch{
            //console.log(`no line to remove`);
        }
        //delete dragbox_lines[line_name];
    }
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

function make_recycle_box(){
    const svgbox = document.getElementById("svgbox");
    //<line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />
    var xy = [[0, 80, 0, 120], [40, 80, 40, 120], [0, 120, 40, 120], [0, 80, 40, 80]];
    for(i in xy){
        var [x1, y1, x2, y2] = xy[i];
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttributeNS(null, "x1", x1);
        line.setAttributeNS(null, "y1", y1);
        line.setAttributeNS(null, "x2", x2);
        line.setAttributeNS(null, "y2", y2);
        line.setAttributeNS(null, "style", "stroke:rgb(255, 0, 0);stroke-width:0.2");
        svgbox.appendChild(line);
    }
}

function highlight_selected_blocks(selected_blocks){
    var json_data = {};
    for(idx in selected_blocks){
        elem = selected_blocks[idx].elem;
        id = elem.getAttributeNS(null, "id");
        json_data[id] = blocks[id].get_json_data();
    }
    httpPostAsync(get_address() + "hsc", generate_highlight_tiles("blue"), json_data);
}

function highlight_connected_region(x, y){
    //highlight_tiles([{x: 10, y: 10}, {x: 10, y: 11}]);
    //highlight_tiles([{"x": x, "y": y}]);
    //set_message("highlighted");
    var json_data = {};
    for (id in blocks){
        if(blocks[id].moved || 0){
            json_data[id] = blocks[id].get_json_data();
        }
    }
    json_data["tile"] = {"x": x, "y": y};

    httpPostAsync(get_address() + 'hcr', generate_highlight_tiles("yellow"), json_data);
}

function generate_highlight_tiles(color){
    function highlight_tiles(tiles){
        flush_highlighted();
        tiles = JSON.parse(tiles);
        //set_message(tiles);
        const svgbox = document.getElementById("svgbox");
        for (idx in tiles){
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            //console.log(tiles[idx]);
            //console.log(tiles[idx]["x"]);
            //console.log(tiles[idx]["y"]);
            rect.setAttributeNS(null, "x", tiles[idx]["x"] * 4);
            rect.setAttributeNS(null, "y", tiles[idx]["y"] * 4);
            rect.setAttributeNS(null, "width", 4);
            rect.setAttributeNS(null, "height", 4);
            rect.setAttributeNS(null, "fill", color);
            rect.setAttributeNS(null, "fill-opacity", 0.3);
            rect.setAttributeNS(null, "pointer-events", "none");
            svgbox.appendChild(rect);
            highlighted_tiles.push(rect);
        }    
    }
    return highlight_tiles;
}

function flush_highlighted(){
    const svgbox = document.getElementById("svgbox");
    for(idx in highlighted_tiles){
        svgbox.removeChild(highlighted_tiles[idx]);
    }
    highlighted_tiles = [];
}



/*
function get_connected_regions(id2coords, coords2ids){
    const id2cr = new Map();

    var remaining_ids = [];
    for (id in id2coords.keys()){
        remaining_ids.push(id);
    }

    console.log(id2coords.keys);

    while (remaining_ids.length){
        const id0 = remaining_ids.pop();
        id2cr[id0] = [id0];
        var coords = new Array(id2coords[id0]);
        var seen = []
        while (coords.length){
            const xy = coords.pop();
            if (seen.includes(xy)){
                continue;
            }else{
                seen.push(xy);
            }
            const idsxy = coords2ids[xy];
            for (idxy in idsxy){
                if (idxy == id0){
                    continue;
                }
                if (!remaining_ids.includes(idxy)){
                    continue;
                }
                id2cr[id0].push(idsxy);
                for (coord in id2coords[idsxy]){
                    coords.push(coord);
                }
                remaining_ids.remove(idxy);
            }
        }
    }
    return id2cr;
}
*/

var top_id = 0;
var blocks = new Map();
var dragbox_lines = new Map();
var highlighted_tiles = [];
make_lines();
make_recycle_box();

//console.log(get_connected_regions({0: [0], 1: [1], 2: [2], 3: [0, 1, 3, 4]}))
//console.log(get_connected_regions({0: [0], 1: [1]}, {0: [0], 1: [1]}));


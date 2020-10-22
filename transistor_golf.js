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
        this.length = 1;
        this.x = 0;
        this.y = 0;
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

    rotate90(){}

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
    var draw_bar = false;
    var bar_width = -1;

    spawn("all");

    function start_drag(event){
        event.preventDefault();
        flush_highlighted();
        if(event.shiftKey){
            var coord = get_mouse_position(event);
            elem = spawn_bar(parseInt(coord.x / 4) * 4 , parseInt(coord.y / 4) * 4);
            draw_bar = true;
            return;
        }
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
                if(target.classList.contains("bar")) {return;}
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
        if(event.shiftKey && draw_bar){
            var coord = get_mouse_position(event);
            id = elem.getAttributeNS(null, "id");
            block = blocks[id];
            x0 = elem.getAttributeNS(null, "x0");
            y0 = elem.getAttributeNS(null, "y0");
            if(Math.abs(coord.x - x0) >= Math.abs(coord.y - y0)){
                block.rot = 0;
                if(coord.x < x0){
                    elem.setAttributeNS(null, "x", align(coord.x));
                    compensate = 2;
                }else{
                    compensate = 0;
                }
                elem.setAttributeNS(null, "width", align(Math.abs(coord.x - x0)) + compensate * 4);
                block.length = parseInt(Math.abs(coord.x - x0) / 4) + compensate;
                elem.setAttributeNS(null, "height", 4);
            }else{
                block.rot = 1;
                if(coord.y < y0){
                    elem.setAttributeNS(null, "y", align(coord.y));
                    compensate = 2;
                }else{
                    compensate = 0;
                }
                elem.setAttributeNS(null, "width", 4);
                elem.setAttributeNS(null, "height", align(Math.abs(coord.y - y0)) + compensate * 4);
                block.length = parseInt(Math.abs(coord.y - y0) / 4) + compensate;
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
                //if((x <= 40 && (120 - y) <= 40) || x <= 0 || x >= 300 || y <= 0 || y >= 120){
                if(x <= 24 || x >= 300 || y <= 0 || y >= 120){
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
        }else if(draw_bar){
            id = elem.getAttributeNS(null, "id");
            x = elem.getAttributeNS(null, "x");
            y = elem.getAttributeNS(null, "y");
            blocks[id].move_to(x, y);
            bar_width = -1;
            draw_bar = false;
            elem = false;
        }
        begin_drag = false;
        sort_zorder();
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

function spawn_bar(x, y){
    rect = spawn_("rect", "bar", x, y, 4, 4, false, -1);
    rect.setAttributeNS(null, "x0", x);
    rect.setAttributeNS(null, "y0", y);
    rect.setAttributeNS(null, "fill", "#000000");
    rect.setAttributeNS(null, "fill-opacity", 0.3);
    blocks[top_id] = new Bar(top_id, rect);
    top_id = top_id + 1;
    return rect
}

function spawn(elem_class){
    const svgbox = document.getElementById("svgbox");
    if (elem_class == "draggable pos transistor" || elem_class == "all"){
        svg = spawn_("image", "pos transistor", 0, 0, 12, 8, "transistor_pos", -1);
        blocks[top_id] = new Transistor(top_id, -1, svg);
    }
    if (elem_class == "draggable neg transistor" || elem_class == "all"){
        svg = spawn_("image", "neg transistor", 0, 8, 12, 8, "transistor_neg", -1);
        blocks[top_id] = new Transistor(top_id, 1, svg);
    }
    if (elem_class == "draggable vdd" || elem_class == "all"){
        svg = spawn_("image", "vdd", 0, 20, 4, 4, "vdd", 1);
        blocks[top_id] = new Node(top_id, "supply", svg);
    }
    if (elem_class == "draggable gnd" || elem_class == "all"){
        svg = spawn_("image", "gnd", 0, 24, 4, 4, "gnd", 1);
        blocks[top_id] = new Node(top_id, "ground", svg);
    }
    if (elem_class == "draggable x" || elem_class == "all"){
        svg = spawn_("image", "x", 0, 28, 4, 4, "x", 1);
        blocks[top_id] = new Node(top_id, "input", svg);
    }
    if (elem_class == "draggable t" || elem_class == "all"){
        svg = spawn_("image", "t", 0, 32, 4, 4, "t", 1);
        blocks[top_id] = new Node(top_id, "output", svg);
    }
    if (elem_class == "draggable isolator" || elem_class == "all"){
        svg = spawn_("image", "isolator", 0, 36, 4, 4, "b", 1);
        blocks[top_id] = new Node(top_id, "isolator", svg);
    }
    top_id = top_id + 1;
}

function spawn_(svg_type, class_name, x0, y0, width, height, filename, zindex){
        const svg = document.createElementNS("http://www.w3.org/2000/svg", svg_type);
        svg.setAttributeNS(null, "class", `draggable ${class_name}`);
        svg.setAttributeNS(null, "width", width);
        svg.setAttributeNS(null, "height", height);
        svg.setAttributeNS(null, "x", x0);
        svg.setAttributeNS(null, "y", y0);
        if(filename){ svg.setAttributeNS(null, "href", `sprites/${filename}.svg`); }
        svg.setAttributeNS(null, "id", top_id);
        svg.setAttributeNS(null, "z-index", zindex);
        svgbox.appendChild(svg);
        return svg
}

function sort_zorder(){
    var draggables = d3.selectAll(".draggable");
    draggables.data(draggables[0].map(function(cv){ return cv.getAttributeNS(null, "z-index"); }));
    draggables.sort(d3.ascending);
}


function httpPostAsync(url, callback, json_data)
{
    var xhr = new XMLHttpRequest();

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
    //var xy = [[0, 80, 0, 120], [40, 80, 40, 120], [0, 120, 40, 120], [0, 80, 40, 80]];
    var xy = [[24, 0, 24, 120]];
    for(i in xy){
        var [x1, y1, x2, y2] = xy[i];
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttributeNS(null, "x1", x1);
        line.setAttributeNS(null, "y1", y1);
        line.setAttributeNS(null, "x2", x2);
        line.setAttributeNS(null, "y2", y2);
        line.setAttributeNS(null, "style", "stroke:rgb(50, 50, 50);stroke-width:0.2");
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

function align(x){
    return parseInt(x / 4) * 4;
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


class Component{
    rotate90(){
        //rotation by 90 degrees
        this.rot = (this.rot + 1) % 4;
        this.x = this.x + 4;
    }

    move_to(x, y){
        this.x = parseInt(x / 4);
        this.y = parseInt(y / 4);
    }
}

class Bar extends Component{
    constructor(id){
        super();
        this.id = id;
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
    constructor(id, type_name){
        super();
        this.id = id;
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
    constructor(id, sign){
        super();
        this.id = id;
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
    var offset;

    spawn("all");

    function start_drag(event){
        event.preventDefault();
        if (event.target.classList.contains("draggable")){
            if (event.button == 0){
                elem = event.target;
                var coord = get_mouse_position(event);
                offset = {
                            x: coord.x - elem.getAttributeNS(null, "x"),
                            y: coord.y - elem.getAttributeNS(null, "y")
                         };
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
        }
        if(elem && !(elem.getAttributeNS(null, "nontrivial"))){
            spawn(elem.getAttributeNS(null, "class"));
            elem.setAttributeNS(null, "nontrivial", "true");
        }
    }

    function drag(event){
        if (elem){
            event.preventDefault();
            var coord = get_mouse_position(event);
            var rot = elem.getAttributeNS(null, "rotation") || 0;
            elem.setAttributeNS(null, "x", parseInt((coord.x - offset.x + 2)/4)*4);
            elem.setAttributeNS(null, "y", parseInt((coord.y - offset.y + 2)/4)*4);
            var mid = get_rect_mid(elem);
            elem.setAttributeNS(null, "transform", `rotate(${rot} ${mid.x} ${mid.y})`);

        }
    }

    function end_drag(event){
        if (elem){
            id = elem.getAttributeNS(null, "id");
            blocks[id].move_to(elem.getAttributeNS(null, "x"), elem.getAttributeNS(null, "y"));
            elem = false;            
        }
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
        blocks[top_id] = new Transistor(top_id, 1);
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
        blocks[top_id] = new Transistor(top_id, -1);
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
        blocks[top_id] = new Bar(top_id);
        top_id = top_id + 1;
    }
    if (elem_class == "all"){
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
        blocks[top_id] = new Node(top_id, "supply");
        top_id = top_id + 1;
    }
    if (elem_class == "all"){
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
        blocks[top_id] = new Node(top_id, "ground");
        top_id = top_id + 1;
    }
    if (elem_class == "draggable x" || elem_class == "all"){
        if(num_x > 1){
            return;
        }else{
            num_x += 1;
        }
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "image");
        //const rect = document.createElement("box");
        //rect.setAttributeNS(null, "class", "draggable");
        //rect.classList.add("transistor");
        rect.setAttributeNS(null, "class", "draggable x");
        rect.setAttributeNS(null, "title", "x1");
        rect.setAttributeNS(null, "width", 4);
        rect.setAttributeNS(null, "height", 4);
        rect.setAttributeNS(null, "x", 0);
        rect.setAttributeNS(null, "y", 28);
        //rect.setAttributeNS(null, "href", "transistor3.svg")
        rect.setAttributeNS(null, "href", "sprites/x1.svg")
        rect.setAttributeNS(null, "id", top_id);
        rect.setAttributeNS(null, "z-index", 1);
        //rect.setAttributeNS(null, "fill", "#007bff");
        svgbox.appendChild(rect);
        blocks[top_id] = new Node(top_id, "input");
        top_id = top_id + 1;
    }
    if (elem_class == "all"){
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
        blocks[top_id] = new Node(top_id, "output");
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
        blocks[top_id] = new Node(top_id, "isolator");
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
    //json_data = JSON.parse('{"text": "hello from json"}');
    var json_data = {};
    for (id in blocks){
        //console.log(blocks[id].id);
        json_data[id] = blocks[id].get_json_data();
    }

    //console.log(json_data);
    //set_message("created json...");    
    //httpPostAsync('http://127.0.0.1:5000/ec', parse_response, json_data);
    httpPostAsync(get_address() + '/ec', parse_response, json_data);
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
var num_x = 0;
var blocks = new Map();
make_lines();

//console.log(get_connected_regions({0: [0], 1: [1], 2: [2], 3: [0, 1, 3, 4]}))
//console.log(get_connected_regions({0: [0], 1: [1]}, {0: [0], 1: [1]}));


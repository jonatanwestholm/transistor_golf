class Transistor{
    constructor(id){
        this.gate_id = id;
        this.source_id = id + 1;
        this.drain_id = id + 2;
        this.x = 0;
        this.y = 0;
        this.rot = 0;
    }

    rotate90(){
        //rotation by 90 degrees
        this.rot = (this.rot + 1) % 4;
    }

    move_to(x, y){
        this.x = parseInt(x / 4);
        this.y = parseInt(y / 4);
    }

    /*
    */
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
        return [[-this.gate_id, this.source_id, -this.drain_id], 
                [-this.gate_id, -this.source_id, this.drain_id]];
    }

    /* P-channel version, or whatever it's called
    get_clauses(){
        return [[this.gate_id, this.source_id, -this.drain_id], 
                [this.gate_id, -this.source_id, this.drain_id]];
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

    spawn();

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
                target.setAttributeNS(null, "transform", `rotate(${rot} ${mid.x} ${mid.y})`);
                id = target.getAttributeNS(null, "id");
                blocks[id].rotate90();
                //set_message(`${target.getAttributeNS(null, "x")} ${target.getAttributeNS(null, "y")}`);
            }
        }
        if(elem && !(elem.getAttributeNS(null, "nontrivial"))){
            spawn();
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
    rect.setAttributeNS(null, "id", top_id);
    //rect.setAttributeNS(null, "fill", "#007bff");
    svgbox.appendChild(rect);
    blocks[top_id] = new Transistor(top_id);
    top_id = top_id + 3;
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


var top_id = 0;
var blocks = new Map();
make_lines();

//console.log(get_connected_regions({0: [0], 1: [1], 2: [2], 3: [0, 1, 3, 4]}))
console.log(get_connected_regions({0: [0], 1: [1]}, {0: [0], 1: [1]}));


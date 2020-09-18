from itertools import groupby, chain
from functools import partial
from collections import defaultdict, namedtuple
import numpy as np
import networkx as nx

from sugarrush.solver import SugarRush

Bar = namedtuple("Bar", ["pos", "rot", "length"])
#Transistor = namedtuple("Transistor", ["comp_type", "pos", "rot", "var"])
Node = namedtuple("Node", ["name", "pos", "var"])

'''
    if component.comp_type == "Node":
        return [component.pos]
    elif component.comp_type == "Transistor":
        if component.rot == 0:
            diffs = [(1, 0), (0, 1), (2, 1)]
        elif component.rot == 1:
            diffs = [(1, 1), (0, 0), (0, 2)]
        elif component.rot == 2:
            diffs = [(1, 1), (0, 0), (2, 0)]
        elif component.rot == 3:
            diffs = [(0, 1), (1, 0), (1, 2)]
        return [component.pos + np.array([i, j]) for i, j in diffs]
'''

def get_covered_points(bar):
        if bar.rot == 0:
            diff = (1, 0)
        elif bar.rot == 1:
            diff = (0, 1)
        elif bar.rot == 2:
            diff = (-1, 0)
        elif bar.rot == 3:
            diff = (0, -1)
        return [tuple(np.array(bar.pos) + i * np.array(diff)) for i in range(bar.length)]


def get_connected_components(bars):
    if not bars:
        return 

    comp2coords = {bar: get_covered_points(bar) for bar in bars}
    '''
    coord2comps = defaultdict(list)
    for comp, coords in comp2coords.items():
        for coord in coords:
            coord2comps[coord].append(comp)
    '''

    G = nx.Graph()

    for comp, coords in comp2coords.items():
        for coord in coords:
            G.add_edge(comp, coord)

    #bar_ex = next(iter(bars))
    coord_ex = next(iter(coords))
    for cc in nx.connected_components(G):
        #yield [c for c in cc if type(c) == type(bar_ex)]
        yield [c for c in cc if type(c) == type(coord_ex)]


def get_coord_dict(bars):
    ccs = get_connected_components(bars)
    coord_dict = {}
    for cc in ccs:
        for c in cc:
            coord_dict[c] = cc[0]
    return coord_dict


def get_NOT_GATE(solver):
    bars = [Bar((0, 0), 1, 5),
            Bar((0, 1), 0, 5),
            Bar((0, 3), 0, 5)
        ]

    supplys = [Node("VDD", (5, 0), solver.var())]
    grounds = [Node("GND", (5, 4), solver.var())]
    inputs  = [Node("X", (0, 2), solver.var())]
    outputs = [Node("T", (5, 2), solver.var())]

    transistors = [[Node("POS_G", (4, 1), solver.var()), 
                    Node("POS_S", (5, 2), solver.var()),
                    Node("POS_D", (5, 0), solver.var()), -1],
                   [Node("NEG_G", (4, 3), solver.var()), 
                    Node("NEG_S", (5, 4), solver.var()),
                    Node("NEG_D", (5, 2), solver.var()), 1],
                ]

    return bars, supplys, grounds, inputs, outputs, transistors


def main():
    solver = SugarRush()

    '''
    bars = [Bar("Bar", (0, 0), 0, 5, solver.var()),
            Bar("Bar", (4, 0), 0, 5, solver.var()),
            Bar("Bar", (7, 0), 1, 5, solver.var()),
            Bar("Bar", (7, 5), 0, 5, solver.var())
        ]
    supplys = [Node("Node", (0, 0), "supply", solver.var())]
    grounds = [Node("Node", (8, 5), "ground", solver.var())]
    inputs  = [Node("Node", (7, 0), "input", solver.var())]
    outputs = []
    transistors = []
    '''
    bars, supplys, grounds, inputs, outputs, transistors = get_NOT_GATE(solver)

    all_vars = supplys + grounds + inputs + outputs + [node for trans in transistors for node in trans[:-1]]
    #print(all_vars)
    coord_dict = get_coord_dict(bars)
    #print(coord_dict)

    def default_map(c):
        if c.pos in coord_dict:
            return coord_dict[c.pos]
        else:
            return c.pos

    ccs = []
    for _, cc in groupby(sorted(all_vars, key=default_map), key=default_map):
        cc = list(cc)
        all_on = [[c.var] for c in cc]
        all_off = [[-c.var] for c in cc]
        #print(all_on, all_off)
        solver.add(solver.disjunction([all_on, all_off]))
        print(", ".join([c.name for c in cc]))
        ccs.append(cc)

    for supply in supplys:
        solver.add([supply.var])

    for ground in grounds:
        solver.add([-ground.var])

    for gate, source, drain, trans_sign in transistors:
        solver.add(get_transistor_clauses(gate.var, source.var, drain.var, trans_sign))

    x_lit = inputs[0].var
    t_lit = outputs[0].var

    for x_sign in [-1, 1]:
        if solver.solve(assumptions=[x_sign * x_lit]):
            print("x:", solver.solution_value(x_lit), ", t:", solver.solution_value(t_lit))
            for cc in ccs:
                print(*[solver.solution_value(c.var) for c in cc])
        else:
            print("assumption failed:", x_sign)
    '''
    '''


def get_transistor_clauses(gate, source, drain, trans_sign):
    # trans_sign: 1 for positive transistor (connects when gate is supply voltage)
    #            -1 for negative transistor (connects when gate is  drain voltage)
    return [[-trans_sign * gate, source, -drain], [-trans_sign * gate, -source, drain]]








if __name__ == '__main__':
    main()
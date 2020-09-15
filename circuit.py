from collections import defaultdict, namedtuple
import numpy as np
import networkx as nx

from sugarrush.solver import SugarRush

Bar = namedtuple("Bar", ["comp_type", "pos", "rot", "length"])
Transistor = namedtuple("Transistor", ["comp_type", "pos", "rot"])
Node = namedtuple("Node", ["comp_type", "pos", "signal_type"])

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

def get_covered_points(component):
    if component.comp_type == "Bar":
        if component.rot == 0:
            diff = (1, 0)
        elif component.rot == 1:
            diff = (0, 1)
        elif component.rot == 2:
            diff = (-1, 0)
        elif component.rot == 3:
            diff = (0, -1)
        return [tuple(np.array(component.pos) + i * np.array(diff)) for i in range(component.length)]


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

    bar_ex = next(iter(bars))
    for cc in nx.connected_components(G):
        yield [c for c in cc if type(c) == type(bar_ex)]


# given components, return satisfiable assignments to all nodes
def get_satisfiable():
    solver = SugarRush()


def main():
    bars = [Bar("Bar", (0, 0), 0, 5),
            Bar("Bar", (4, 0), 0, 5),
            Bar("Bar", (7, 0), 1, 5),
            Bar("Bar", (7, 5), 0, 5)
        ]


    for connected_component in get_connected_components(bars):
        print(connected_component)


if __name__ == '__main__':
    main()
#!/usr/bin/env python
#-*- coding:utf-8 -*-
##
## solver.py
##
##  Created on: Sep 24, 2019
##      Author: Jonatan D. Westholm 
##      E-mail: jonatanwestholm@gmail.com
##

"""
    ===============
    Module Details
    ===============

"""


from pysat.solvers import Solver
from pysat.card import CardEnc, EncType, ITotalizer
from pysat.formula import CNF

from sugarrush.utils import flatten_simple as flatten
from sugarrush.utils import dbg


class SugarRush(Solver):
    """
        Quality-of-life wrapper for pysat.solvers.Solver

        *   Does automatic bookkeeping of literals.
        *   When calling constraint builders, new literals are assigned,
            that do not interfere with existing literals. 
        *   New literals can also be created and accessed by :meth:`var`.
        *   After solving, the solution value for a given var, 
            can be obtained by :meth:`solution_value`.
        *   Constraint builders return CNF's, 
            but do not add them automatically to the model.


    """
    def __init__(self, name="glucose4"):
        super().__init__(name=name)
        self.var2val = {}
        self.lits = set([0])

    def var(self):
        """
            **Added in SugarRush**\n
            Return a new unused variable. 
        """
        self.lits.add(self._top_id() + 1)
        return self._top_id()

    def add(self, c):
        """
            **Added in SugarRush**\n
            If c is iterable of iterable of ints, then interpret as CNF.
            If c is iterable of ints (simple list of literals), 
            then interpet as single clause.\n
            Simple list of literals:

            .. code-block:: python

                >>> from sugarrush.solver import SugarRush
                >>> with SugarRush() as solver:
                        X = [solver.var() for _ in range(6)]
                        solver.add(X)
                        solver.solve()
                        print(solver.solution_values(X))
                [1, 0, 0, 0, 0, 0]

            List of list of literals:

            .. code-block:: python

                >>> from sugarrush.solver import SugarRush
                >>> with SugarRush() as solver:
                         X = [solver.var() for _ in range(6)]
                        solver.add([X])
                        solver.solve()
                        print(solver.solution_values(X))
                [1, 0, 0, 0, 0, 0]

            Normal CNF:

            .. code-block:: python

                >>> from sugarrush.solver import SugarRush
                >>> with SugarRush() as solver:
                        X = [solver.var() for _ in range(6)]
                        solver.add([X[:3], X[3:]])
                        solver.solve()
                        print(solver.solution_values(X))
                [1, 0, 0, 1, 0, 0]

        """
        for elem in c:
            try:
                iter(elem)
            except TypeError:
                self._add(c) # c is list of ints
                break
            self._add(*c) # c is list of lists of ints
            break

    def _add(self, *clauses):
        for clause in clauses:
            self._add_clause(clause)

    def _add_clause(self, clause):
        self._add_lits(clause)
        self.add_clause(clause)

    def _add_lits(self, lits):
        """
            **Added in SugarRush**\n
            Update the internal set of literals.
        """
        for lit in lits:
            self.lits.add(abs(lit))

    def _add_lits_from(self, cnf):
        """
            **Added in SugarRush**\n
            Update the internal set of literals from a CNF.
        """
        self._add_lits(flatten(cnf))

    def _top_id(self):
        """
            **Added in SugarRush**\n
            Return the largest valued literal in use by the model.
        """
        return max(self.lits)

    def _init_var2val(self):
        """
            **Added in SugarRush**\n
            Initialize a mapping to the solved values. The mapping 
            is such that **var2val[var]** has the same boolean value as 
            :param:`var` in the satisfying assignment.
        """
        for val in self.get_model():
            if abs(val) in self.lits:
                self.var2val[abs(val)] = (val > 0) * 1 # 1-indexed

    def solve(self, **kwargs):
        ret = super().solve(**kwargs)
        self.solver_called = True
        return ret

    def solution_value(self, var):
        """
            **Added in SugarRush**\n
            Get solved value of **var**. Must not be run before successful solve.
        """
        try:
            _ = self.solver_called
        except AttributeError:
            raise TypeError("Solver.solution_value() called before model solved")
            
        if (not self.var2val) or self.solver_called:
            self._init_var2val()
            solver_recalled = False
        return self.var2val[var]

    def solution_values(self, variables):
        """
            **Added in SugarRush**\n
            List version of :meth:`solution_value`.
        """
        return [self.solution_value(var) for var in variables]

    def print_stats(self):
        """
            **Added in SugarRush**\n
            Print number of variables and number of clauses used by the solver.
        """
        print("Nof variables:", self.nof_vars())
        print("Nof clauses:", self.nof_clauses())

    def print_values(self):
        """
            **Added in SugarRush**\n
            Print full mapping from vars to boolean values
        """
        for var, val in sorted(self.var2val.items()):
            print("{}: {}".format(var, val))

    """
    Constructs
    """
    def equals(self, lits, bound=1, encoding=EncType.seqcounter):
        """
            **Added in SugarRush**\n
            Uses :meth:`pysat.card.CardEnc.equals`.
            Adds automatic bookkeeping of literals.
        """
        cnf = CardEnc.equals(lits=lits,
                             bound=bound,
                             encoding=encoding,
                             top_id=self._top_id())
        clauses = cnf.clauses
        self._add_lits_from(clauses)
        return clauses

    def atmost(self, lits, bound=1, encoding=EncType.seqcounter):
        """
            **Added in SugarRush**\n
            Uses :meth:`pysat.card.CardEnc.atmost`.
            Adds automatic bookkeeping of literals.
        """
        cnf = CardEnc.atmost(lits=lits,
                             bound=bound,
                             encoding=encoding,
                             top_id=self._top_id())
        clauses = cnf.clauses
        self._add_lits_from(clauses)
        return clauses
        #self.add(clauses)
        #return cnf.clauses

    def negate(self, clauses):
        """
            **Added in SugarRush**\n
            Uses :meth:`pysat.formula.CNF.negate`.
            Adds automatic bookkeeping of literals.
        """
        cnf = CNF(from_clauses=clauses)
        neg = cnf.negate(topv=self._top_id())
        neg_clauses = neg.clauses
        self._add_lits_from(neg_clauses)
        #neg_force = [[-auxvar] for auxvar in neg.auxvars]
        #print(neg_force)
        #self.add(neg_force)
        #print(neg.auxvars)
        #self.add([neg.auxvars])
        return neg_clauses

    def indicator(self, cnf):
        """
            **Added in SugarRush**\n
            Uses Tseytin transformation to create a variable that has the 
            same boolean value as the given CNF.
            Does automatic bookkeeping of literals.
            Creates len(cnf) + 1 new variables

            Return indicator variable, and the equivalence clauses
        """
        indicators = []
        clauses = []
        for clause in cnf:
            p, equivalence = self.indicate_disjunction(clause)
            indicators.append(p)
            clauses.extend(equivalence)

        p, equivalence = self.indicate_conjunction(indicators)
        clauses.extend(equivalence)
        return p, clauses

    def indicate_disjunction(self, clause):
        """
            **Added in SugarRush**\n
            p <=> (c1 OR c2 OR ... OR cn)
        """
        p = self.var()
        right_imp = [clause + [-p]] # p => (c1 OR c2 OR ... OR cn)
        left_imp = [[-c, p] for c in clause] # (c1 OR c2 OR ... OR cn) => p
        equivalence = right_imp + left_imp
        return p, equivalence

    def indicate_conjunction(self, clause):
        """
            **Added in SugarRush**\n
            p <=> (c1 AND c2 AND ... AND cn)
        """
        p = self.var()
        right_imp = [[-p, c] for c in clause] # p => (c1 AND c2 AND ... AND cn)
        left_imp = [[-c for c in clause] + [p]] # (c1 AND c2 AND ... AND cn) => p
        equivalence = right_imp + left_imp
        return p, equivalence

    def disjunction(self, cnfs):
        """
            **Added in SugarRush**\n
            Uses :meth:`indicator` to create a CNF that has the same boolean value
            as the disjunction of a given set of CNF's. 
            Does automatic bookkeeping of literals.
        """
        inds = []
        clauses = []
        for cnf in cnfs:
            p, equiv = self.indicator(cnf)
            inds.append(p)
            clauses.extend(equiv)
        clauses.append(inds)
        return clauses

    def itotalizer(self, lits, ubound=None):
        """
            **Added in SugarRush**\n
            Uses :meth:`pysat.card.ITotalizer`.
            Adds automatic bookkeeping of literals.
        """
        if ubound is None:
            ubound = len(lits)
        itot = ITotalizer(lits, ubound)
        clauses = itot.cnf.clauses
        bound_vars = itot.rhs
        self._add_lits_from(clauses)
        return clauses, bound_vars

    def optimize(self, itot, search="linear"):
        if search == "linear":
            return self.optimize_linear(itot)
        elif search == "binary":
            return self.optimize_binary(itot)
        else:
            raise Exception("Unknown search method!")

    def optimize_linear(self, itot):
        self.print_stats()
        ub = len(itot) - 1
        if not self.solve(assumptions=[-itot[ub]]):
            return None
        ub -= 1
        while ub >= 0:
            print("ub:", ub)
            if not self.solve(assumptions=[-itot[ub]]):
                print("returning:", ub + 1)
                return ub + 1
            else:
                ub -= 1
        return 0

    def optimize_binary(self, itot, debug=False):
        """
            **Added in SugarRush**\n
            Uses binary search to find the smallest satisfiable value for the ITotalizer.
            Assumes that satisfiability is monotonically increasing.
        """
        upper = len(itot) - 1 # smallest known to be feasible
        lower = 0 # largest known to be infeasible (after initial check)
        if not self.solve(assumptions=[-itot[upper]]):
            return None
        if self.solve(assumptions=[-itot[lower]]):
            return 0
        while True:
            mid = (upper + lower) // 2
            dbg("upper: %d" % upper, debug)
            dbg("mid: %d" % mid, debug)
            dbg("lower: %d" % lower, debug)
            if mid == lower:
                break
            satisfiable = self.solve(assumptions=[-itot[mid]])
            dbg("satisfiable: %d" % satisfiable, debug)
            if satisfiable:
                upper = mid
            else:
                lower = mid
            dbg("", debug)
        self.solve(assumptions=[-itot[upper]])
        return upper
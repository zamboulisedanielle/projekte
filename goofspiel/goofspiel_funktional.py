from random import choice, shuffle
import helper
from functools import reduce


anfangs_seed = 42

anfangsstates = ({'seed' : anfangs_seed, 
         'punkte_spieler1' : 0, 
         'punkte_spieler2' : 0, 
         'karten_spieler1': helper.neues_kartenspiel(),
         'karten_spieler2': helper.neues_kartenspiel(),
         'karte_spieler1': None,
         'karte_spieler2': None,
         'preiskarten': helper.neues_kartenspiel(),
         'preiskarte': None,
         'strategie_spieler1': helper.spiele_den_wert_der_preiskarte,
         'strategie_spieler2': helper.spiele_zufällige_karte,
         'runden_doku': ''
         }, ) 


states = helper.spiel_rekursiv(lambda states: (len(states[-1]['preiskarten'])<=0),
                                lambda states: helper.spielrunde(states[-1]),
                                anfangsstates)

gesamte_doku = reduce(lambda gesamte_doku, state: gesamte_doku + state["runden_doku"], states, "") + "\n" \
                + helper.gewinner_ausgeben(states[-1]["punkte_spieler1"], states[-1]["punkte_spieler2"])


### Ab hier: Nebeneffekt! Printe den Spielverlauf
print(gesamte_doku)

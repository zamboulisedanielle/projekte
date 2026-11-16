import random


def spiel_rekursiv(abbruchbedingung, spielrunde, states):
    """
    Funktion, die ein Spiel rekursiv implementiert. Eingaben sind
    - abbruchbedingung: Funktion, die ein Tupel "states" entgegennimmt und einen boolschen
      Wert zurückgibt. Dieser ist true wenn mit dem Spiel aufgehört werden soll und 
      false wenn mit dem Spiel noch nicht aufgehört werden soll
    - spielrunde: Funktion, die ein Tupel "states" entgegennimmt und den nächsten Eintrag, 
      der den states hinzugefügt werde sollte, zurückgibt.
    - states: Anfangszustand als Tupel mit einem Eintag 

    Rückgabe ist die Variable states nach Spielende, also die Sammlung der Zustände aller 
    Spielrunden.
    """
    if abbruchbedingung(states):
        return states
    else:
        states +=  (spielrunde(states),)
        return spiel_rekursiv(abbruchbedingung, spielrunde, states)

def neues_kartenspiel(n=13):
    """
    Erstellt ein neues Kartenspiel in Form einer Liste mit Zahlen von 1 bis n
    Eingabe: Integer n
    Ausgabe: Tuple mit Integern von 1 bis n
    """

    return tuple(range(1,n+1))

def spielstand_ausgeben(ps1, ps2):
    """
    Druckt den aktuellen Spielstand auf die Kommandozeile.
    Eingaben
    - ps1: Integer oder Float - Punkte von Spieler 1
    - ps2: Integer oder Float - Punkte von Spieler 2
    """
    return "Spieler 1 hat "+str(ps1)+" Punkte. Spieler 2 hat "+str(ps2)+" Punkte!\n"

def runde_dokumentieren(pk, ks1, ks2):
    s = "Die Preiskarte ist "+ str(pk) +"\n"
    s += "Spieler 1 spielt Karte "+ str(ks1)+"\n"
    s += "Spieler 2 spielt Karte "+ str(ks2)+"\n"
    return s

def runde_auswerten(karte_spieler1, karte_spieler2, preiskarte, punkte_spieler1, punkte_spieler2):
    if karte_spieler1>karte_spieler2:
        punkte_spieler1 = punkte_spieler1 + preiskarte
    elif karte_spieler2>karte_spieler1:
        punkte_spieler2 = punkte_spieler2 + preiskarte
    
    return punkte_spieler1, punkte_spieler2

def gewinner_ausgeben(punkte_spieler1, punkte_spieler2):
    if punkte_spieler1 > punkte_spieler2:
        return "Spieler 1 hat gewonnen!"
    elif punkte_spieler2 > punkte_spieler1:
        return "Spieler 2 hat gewonnen!"
    else:
        return "Unentschieden!"

def entferne_karte(kartenspiel,karte):
    # finde eine Funktion, die mir den Index i von karte in kartenspiel liefert. 
    # Dann: return kartenspiel[:i] + kartenspiel[i+1:]
    i = kartenspiel.index(karte)
    return kartenspiel[:i] + kartenspiel[i+1:]

def spiele_den_wert_der_preiskarte(kartenspiel, preiskarte, seed):
    return preiskarte, entferne_karte(kartenspiel,preiskarte), seed

def ziehe_karte(kartenspiel, seed):
    zufallsgenerator_mit_seed = random.Random(seed)
    return zufallsgenerator_mit_seed.choice(kartenspiel), seed+1

def spiele_zufällige_karte(kartenspiel, preiskarte, seed):
    karte, neuer_seed = ziehe_karte(kartenspiel, seed)
    return karte, entferne_karte(kartenspiel, karte), neuer_seed

def spielrunde(state):
    # Preiskarte wird aufgedeckt (eine Zahl)
    neue_preiskarte, neuer_seed = ziehe_karte(state['preiskarten'], state['seed'])
    neue_preiskarten = entferne_karte(state['preiskarten'],neue_preiskarte)

    # Spieler spielen ihre Karten
    neue_karte_spieler1, neue_karten_spieler1, neuer_seed = state['strategie_spieler1'](state['karten_spieler1'], neue_preiskarte, neuer_seed)
    neue_karte_spieler2, neue_karten_spieler2, neuer_seed = state['strategie_spieler2'](state['karten_spieler2'], neue_preiskarte, neuer_seed)

    #Dokumentieren der Runde mittels print-Befehlen
    doku_string = runde_dokumentieren(neue_preiskarte, neue_karte_spieler1, neue_karte_spieler2)
    
    # Auswertung der Runde
    neue_punkte_spieler1, neue_punkte_spieler2 = runde_auswerten(neue_karte_spieler1, neue_karte_spieler2, neue_preiskarte, state['punkte_spieler1'], state['punkte_spieler2'])
    
    # Aktueller Spielstand
    spielstand_string = spielstand_ausgeben(neue_punkte_spieler1, neue_punkte_spieler2)

    return {'seed' : neuer_seed, 
         'punkte_spieler1' : neue_punkte_spieler1, 
         'punkte_spieler2' : neue_punkte_spieler2, 
         'karten_spieler1': neue_karten_spieler1,
         'karten_spieler2': neue_karten_spieler2,
         'karte_spieler1': neue_karte_spieler1,
         'karte_spieler2': neue_karte_spieler2,
         'preiskarten': neue_preiskarten,
         'preiskarte': neue_preiskarte,
         'strategie_spieler1': state['strategie_spieler1'],
         'strategie_spieler2': state['strategie_spieler2'],
         'runden_doku': doku_string+spielstand_string
         }
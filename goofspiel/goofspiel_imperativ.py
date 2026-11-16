import random

# repräsentation von drei kartenspielen
karten_spieler1 = [1,2,3,4,5,6,7,8,9,10,11,12,13]
karten_spieler2 = [1,2,3,4,5,6,7,8,9,10,11,12,13]
preiskarten = [1,2,3,4,5,6,7,8,9,10,11,12,13]

# preiskarten mischen
random.shuffle(preiskarten)
random.shuffle(karten_spieler2)

# Punkte initialisieren: Alle fangen bei 0 an
punkte_spieler1 = 0
punkte_spieler2 = 0

# alles was in den Kommentarlinien steht, nennen wir eine "Runde"
# Wiederhole diese Runde bis keine Preiskarten mehr übrig sind 
##############################################
while (len(preiskarten)>0):
    # Preiskarte wird aufgedeckt (eine Zahl)
    preiskarte = preiskarten.pop()

    # Spieler spielen ihre Karten
    karte_spieler1 = preiskarte # Strategie: Spieler 1 spielt immer den Wert der Preiskarte
    karten_spieler1.remove(karte_spieler1)
    karte_spieler2 = karten_spieler2.pop() # Strategie: Spieler 2 spielt eine zufällige Karte
                                #durch  ziehen der obersten Karte aus den gemischten Karten

    #Dokumentieren der Runde mittels print-Befehlen

    print("Die Preiskarte ist "+ str(preiskarte))
    print("Spieler 1 spielt Karte "+ str(karte_spieler1))
    print("Spieler 2 spielt Karte "+ str(karte_spieler2))
    # Auswertung der Runde
    if karte_spieler1>karte_spieler2:
        punkte_spieler1 = punkte_spieler1 + preiskarte
    elif karte_spieler2>karte_spieler1:
        punkte_spieler2 = punkte_spieler2 + preiskarte
        
    print("Spieler 1 hat "+str(punkte_spieler1)+" Punkte. Spieler 2 hat "+str(punkte_spieler2)+" Punkte!\n")



##############################################

# Am Ende: Gewinner / Verlierer bestimmen
print("Spieler 1 hat "+str(punkte_spieler1)+" Punkte. Spieler 2 hat "+str(punkte_spieler2)+" Punkte!")
if punkte_spieler1 > punkte_spieler2:
    print("Spieler 1 hat gewonnen!")
elif punkte_spieler2 > punkte_spieler1:
    print("Spieler 2 hat gewonnen!")
else:
    print("Unentschieden!")

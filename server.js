const http=require('http'),fs=require('fs'),os=require('os'),path=require('path'),{WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000, DUR=30;

const BANK={
 vlan:["VLAN",[
  ["Quel protocole standard encapsule les trames sur un trunk ?",["ISL","802.1Q","802.11","STP"],1,"802.1Q (dot1q) est le standard IEEE de tagging VLAN. ISL est l'ancien protocole propriétaire Cisco."],
  ["VLAN natif et de management par défaut sur un switch Cisco ?",["VLAN 0","VLAN 1","VLAN 10","VLAN 99"],1,"Par défaut tout est dans le VLAN 1. Bonne pratique : le changer pour la sécurité."],
  ["Combien de VLAN utilisables avec le tag 802.1Q (12 bits) ?",["1024","2048","4094","65536"],2,"12 bits = 4096 valeurs, moins 0 et 4095 réservés = 4094 VLAN utilisables."],
  ["Comment circule le trafic du VLAN natif sur un trunk ?",["Taggué double","Non taggué","Chiffré","Priorité 7"],1,"Le VLAN natif circule sans tag. C'est la base des attaques de VLAN hopping."],
  ["Commande pour assigner le port en accès au VLAN 10 ?",["switchport mode vlan 10","switchport access vlan 10","vlan 10 access","set vlan 10"],1,"switchport access vlan 10, après switchport mode access."],
  ["Solution pour router entre VLAN avec UN seul lien physique ?",["Router-on-a-stick","STP","EtherChannel","VTP"],0,"Router-on-a-stick : sous-interfaces dot1q sur une interface physique."],
  ["À quoi sert une SVI (interface VLAN) sur un switch L3 ?",["Bloquer les boucles","Routage inter-VLAN","Gérer le PoE","Synchroniser l'heure"],1,"La SVI est une interface logique L3 par VLAN, pour le routage inter-VLAN."],
  ["Que transporte un port trunk ?",["Un seul VLAN","Plusieurs VLAN","Aucun VLAN","Que le VLAN 1"],1,"Un trunk transporte le trafic de plusieurs VLAN, distingués par le tag."],
  ["Quel est le rôle de VTP ?",["Router entre VLAN","Synchroniser la base VLAN entre switches","Chiffrer les trames","Élire un root bridge"],1,"VTP propage la configuration des VLAN entre switches du même domaine."],
  ["Quel mode VTP ne propage pas et garde sa config locale ?",["Server","Client","Transparent","Dynamic"],2,"En mode transparent, le switch ignore VTP pour sa base mais relaie les annonces."],
  ["Que négocie le protocole DTP entre deux ports ?",["L'adresse IP","La formation d'un trunk","Le débit","Le VLAN natif"],1,"DTP négocie automatiquement l'établissement d'un trunk."],
  ["Un VLAN correspond à un domaine de…",["Collision","Broadcast","Sécurité IP","Routage"],1,"Chaque VLAN est un domaine de broadcast distinct."],
  ["Plage des VLAN étendus ?",["1 à 1005","1006 à 4094","2 à 1001","100 à 200"],1,"VLAN normaux : 1-1005. VLAN étendus : 1006-4094."],
  ["Commande pour voir un résumé des VLAN et leurs ports ?",["show running","show vlan brief","show ip route","show mac"],1,"show vlan brief liste les VLAN et les ports d'accès associés."],
  ["Pour router entre plusieurs VLAN, il faut un équipement de couche…",["1","2","3","7"],2,"Le routage inter-VLAN nécessite un équipement L3."],
  ["Quel VLAN dédie-t-on à la téléphonie IP sur un port ?",["Native VLAN","Voice VLAN","Default VLAN","Trunk VLAN"],1,"Le Voice VLAN sépare le trafic voix du trafic data sur un même port."],
  ["Une incohérence de VLAN natif entre deux trunks génère…",["Un reboot","Un avertissement CDP","Un blocage PoE","Une boucle ARP"],1,"CDP signale un native VLAN mismatch."],
  ["Commande pour limiter les VLAN autorisés sur un trunk ?",["switchport trunk allowed vlan","switchport access vlan","vlan filter","trunk limit vlan"],0,"switchport trunk allowed vlan définit la liste des VLAN transitant sur le trunk."],
 ]],
 routage:["Routage",[
  ["Sur quoi se base la métrique d'OSPF ?",["Nombre de sauts","Coût (bande passante)","Délai","Charge"],1,"OSPF utilise le coût, inversement proportionnel à la bande passante."],
  ["Distance administrative d'OSPF ?",["1","90","110","120"],2,"OSPF = 110. Connecté 0, statique 1, EIGRP 90, OSPF 110, RIP 120."],
  ["Métrique de RIP et sa valeur maximale ?",["Coût, 65535","Sauts, 15","Sauts, 255","Délai, 16"],1,"RIP compte les sauts, max 15. Une métrique de 16 = inaccessible."],
  ["Distance administrative d'une route statique ?",["0","1","110","120"],1,"Route statique = AD 1. Un réseau directement connecté est à 0."],
  ["OSPF est un protocole de type…",["Vecteur de distance","État de liens","Vecteur de chemin","Statique"],1,"OSPF est link-state : carte complète du réseau puis calcul SPF."],
  ["Adresse multicast des paquets Hello d'OSPF ?",["224.0.0.5","224.0.0.9","224.0.0.10","255.255.255.255"],0,"224.0.0.5 = AllSPFRouters. RIPv2 utilise 224.0.0.9."],
  ["Comment s'écrit une route par défaut ?",["0.0.0.0/0","255.255.255.255/32","127.0.0.1/8","10.0.0.0/8"],0,"0.0.0.0/0 : la route la moins spécifique."],
  ["Rôle de l'aire 0 (area 0) en OSPF ?",["Aire de test","Backbone","Aire stub","Aire isolée"],1,"L'area 0 est le backbone ; toutes les aires doivent s'y connecter."],
  ["Le DR et le BDR sont élus sur un réseau…",["Point à point","Broadcast multi-accès","Série","Loopback"],1,"DR/BDR sont élus sur réseau multi-accès broadcast pour réduire les adjacences."],
  ["Distance administrative d'EIGRP (interne) ?",["1","90","110","120"],1,"EIGRP interne = 90, plus fiable qu'OSPF (110) et RIP (120)."],
  ["Comment OSPF choisit-il son Router-ID ?",["IP la plus basse","Loopback la plus haute sinon interface active la plus haute","Aléatoire","MAC la plus haute"],1,"OSPF prend la plus haute IP de loopback, sinon la plus haute IP d'interface active."],
  ["Une route statique flottante sert à…",["Accélérer OSPF","Faire un backup avec une AD plus élevée","Bloquer du trafic","Résumer des routes"],1,"On lui met une AD supérieure pour qu'elle ne serve qu'en secours."],
  ["Mécanisme anti-boucle de RIP qui évite de renvoyer une route par où elle est arrivée ?",["Split horizon","SPF","TTL","Holddown"],0,"Le split horizon empêche d'annoncer une route sur l'interface d'où elle vient."],
  ["Toutes les combien de secondes RIP envoie-t-il ses mises à jour ?",["10 s","30 s","60 s","90 s"],1,"RIP diffuse sa table toutes les 30 secondes par défaut."],
  ["Dans la table de routage, le code « O » désigne une route…",["OSPF","Statique","Connectée","RIP"],0,"O = OSPF, R = RIP, S = statique, C = connectée, D = EIGRP."],
  ["Formule du coût OSPF d'une interface ?",["BP × 100","10^8 / bande passante","Sauts × 10","1 / délai"],1,"Coût = 10^8 / bande passante (bps) par défaut."],
  ["BGP est un protocole de routage de type…",["IGP","EGP (entre systèmes autonomes)","Link-state interne","Statique"],1,"BGP est l'EGP qui route entre systèmes autonomes."],
  ["Commande pour afficher la table de routage IPv4 ?",["show ip route","show vlan","show interfaces","show cdp"],0,"show ip route affiche les routes connues et leur source."],
 ]],
 ip:["Adressage IP",[
  ["Combien d'hôtes utilisables dans un /24 ?",["256","254","128","510"],1,"256 adresses moins le réseau et le broadcast = 254 hôtes."],
  ["Quel masque correspond à un /26 ?",["255.255.255.128","255.255.255.192","255.255.255.224","255.255.255.240"],1,"/26 = 255.255.255.192, soit 62 hôtes par sous-réseau."],
  ["Combien d'hôtes dans 192.168.1.0/26 ?",["64","62","30","126"],1,"2^6 - 2 = 62 hôtes utilisables."],
  ["Quelle plage est privée (RFC 1918) ?",["172.32.0.0/12","192.168.0.0/16","11.0.0.0/8","169.254.0.0/16"],1,"Privées : 10/8, 172.16-31/12, 192.168/16. 169.254 = APIPA."],
  ["À quelle classe appartient 172.16.0.0 ?",["Classe A","Classe B","Classe C","Classe D"],1,"Classe B (128-191 au 1er octet)."],
  ["Quelle plage est l'APIPA (auto-config) ?",["10.0.0.0/8","127.0.0.0/8","169.254.0.0/16","224.0.0.0/4"],2,"169.254.0.0/16 : attribuée quand aucun DHCP ne répond."],
  ["Combien d'hôtes utilisables dans un /30 ?",["4","2","6","1"],1,"2^2 - 2 = 2 hôtes. Idéal pour les liaisons point à point."],
  ["Adresse de broadcast de 192.168.10.0/24 ?",["192.168.10.0","192.168.10.1","192.168.10.255","192.168.10.254"],2,"Le broadcast a tous les bits hôtes à 1 : 192.168.10.255."],
  ["En empruntant 3 bits, combien de sous-réseaux ?",["3","6","8","16"],2,"2^3 = 8 sous-réseaux."],
  ["À quoi sert la plage 127.0.0.0/8 ?",["Multicast","Loopback","Privée LAN","Broadcast"],1,"127.0.0.0/8 = loopback (127.0.0.1 = localhost)."],
  ["Sur combien de bits est codée une adresse IPv6 ?",["32","64","128","256"],2,"IPv6 = 128 bits, contre 32 pour IPv4."],
  ["Quelle est l'adresse de loopback en IPv6 ?",["::1","fe80::1","::","ff02::1"],0,"::1 est le loopback IPv6."],
  ["Quel préfixe identifie les adresses link-local IPv6 ?",["fe80::/10","fc00::/7","2000::/3","ff00::/8"],0,"fe80::/10 = link-local, automatique sur chaque interface."],
  ["Combien d'hôtes utilisables dans un /23 ?",["254","510","1022","256"],1,"2^9 - 2 = 510 hôtes."],
  ["Combien de sous-réseaux /26 tiennent dans un /24 ?",["2","4","8","16"],1,"2 bits empruntés = 4 sous-réseaux."],
  ["Une adresse MAC est codée sur…",["32 bits","48 bits","64 bits","128 bits"],1,"48 bits (6 octets)."],
  ["Que fait DHCP ?",["Routage dynamique","Attribution automatique d'adresses IP","Chiffrement","Résolution de noms"],1,"DHCP attribue IP, masque, passerelle et DNS (cycle DORA)."],
  ["Quel masque correspond à un /30 ?",["255.255.255.240","255.255.255.248","255.255.255.252","255.255.255.254"],2,"/30 = 255.255.255.252, 2 hôtes."],
 ]],
 osi:["Modèle OSI",[
  ["Combien de couches dans le modèle OSI ?",["4","5","7","8"],2,"7 couches : Physique, Liaison, Réseau, Transport, Session, Présentation, Application."],
  ["Sur quelle couche OSI travaille un routeur ?",["1","2","3","4"],2,"Couche 3 (Réseau), décisions basées sur les IP."],
  ["Sur quelle couche travaille un switch classique ?",["1","2","3","7"],1,"Couche 2 (Liaison), commutation par adresses MAC."],
  ["Quelle est la couche de TCP et UDP ?",["2","3","4","5"],2,"Couche 4 (Transport)."],
  ["Comment s'appelle la PDU de la couche 3 ?",["Trame","Paquet","Segment","Bit"],1,"Couche 3 = Paquet."],
  ["Comment s'appelle la PDU de la couche 2 ?",["Paquet","Segment","Trame","Bit"],2,"Couche 2 = Trame, elle porte les MAC."],
  ["Quelle couche gère les câbles et signaux électriques ?",["1","2","3","7"],0,"Couche 1 (Physique)."],
  ["L'adressage IP relève de quelle couche ?",["2","3","4","5"],1,"Couche 3. La MAC est en couche 2."],
  ["Quelle couche est juste au-dessus du Transport ?",["Réseau","Session","Présentation","Application"],1,"Couche 5 = Session."],
  ["Rôle principal de la couche Présentation (6) ?",["Routage","Chiffrement et format des données","Commutation","Adressage IP"],1,"Format, chiffrement et compression."],
  ["Le modèle TCP/IP compte combien de couches ?",["3","4","7","8"],1,"4 couches (Accès réseau, Internet, Transport, Application)."],
  ["HTTP, DNS et SMTP appartiennent à quelle couche ?",["3","4","6","7"],3,"Couche 7 (Application)."],
  ["Quelle couche découpe les données en segments ?",["Réseau","Transport","Liaison","Session"],1,"La couche Transport (4)."],
  ["ICMP (utilisé par ping) opère à quelle couche ?",["2","3","4","7"],1,"ICMP est en couche 3, encapsulé dans IP."],
  ["Un hub (concentrateur) opère à quelle couche ?",["1","2","3","4"],0,"Le hub est en couche 1, il répète les bits."],
  ["Dans quel sens se fait l'encapsulation à l'émission ?",["De 1 vers 7","De 7 vers 1","Couche 4 seulement","Aléatoire"],1,"De l'Application (7) vers le Physique (1)."],
  ["À quoi sert le protocole ARP ?",["Router","Associer une IP à une MAC","Chiffrer","Attribuer des IP"],1,"ARP résout une IP en adresse MAC sur le LAN."],
  ["Un numéro de port (ex 443) est une notion de quelle couche ?",["2","3","4","7"],2,"Les ports sont au niveau Transport (4)."],
 ]],
 acl:["ACL",[
  ["Sur quoi filtre une ACL standard ?",["Source uniquement","Source et destination","Ports","Protocole et port"],0,"L'ACL standard ne filtre que sur l'IP source."],
  ["Sur quoi peut filtrer une ACL étendue ?",["Source seulement","MAC seulement","Source, destination, protocole, port","VLAN"],2,"L'ACL étendue filtre source, destination, protocole et port."],
  ["Quelle plage de numéros pour une ACL standard ?",["1 à 99","100 à 199","200 à 299","1300 à 1999"],0,"Standard : 1-99 (et 1300-1999). Étendue : 100-199."],
  ["Que trouve-t-on implicitement à la fin de toute ACL ?",["permit any","deny any","log all","permit ip any any"],1,"Un deny any implicite : si rien ne matche, rejet."],
  ["Quel wildcard mask correspond à un /24 ?",["255.255.255.0","0.0.0.255","0.0.255.255","0.0.0.0"],1,"Wildcard = inverse du masque : /24 donne 0.0.0.255."],
  ["Que signifie le wildcard 0.0.0.0 ?",["Tout le réseau","Un hôte unique","Toutes les IP","Le broadcast"],1,"Une seule adresse (équivaut à host)."],
  ["Où placer idéalement une ACL standard ?",["Près de la source","Près de la destination","Sur le backbone","Peu importe"],1,"Près de la destination, car elle ne filtre que la source."],
  ["Où placer idéalement une ACL étendue ?",["Près de la source","Près de la destination","Sur la loopback","Sur la passerelle"],0,"Près de la source, pour bloquer tôt."],
  ["Dans quels sens applique-t-on une ACL sur une interface ?",["in uniquement","out uniquement","in et out","aucun"],2,"En entrée (in) ou en sortie (out)."],
  ["Comment une ACL évalue-t-elle ses entrées ?",["Au hasard","De haut en bas, premier match","La plus spécifique d'abord","De bas en haut"],1,"Séquentiel, de haut en bas, premier match appliqué."],
  ["Que signifie le wildcard 255.255.255.255 ?",["Un hôte","Aucune adresse","Toutes les adresses (any)","Le LAN"],2,"Ignore tous les bits : équivaut à any."],
  ["Quel mot-clé d'une ACL étendue n'autorise que les réponses TCP déjà initiées ?",["established","permit","reflect","any"],0,"established laisse passer le trafic TCP de retour."],
  ["Quelle commande protège l'accès Telnet/SSH (lignes VTY) ?",["ip access-group","access-class","line acl","vty filter"],1,"access-class applique une ACL aux lignes VTY."],
  ["Effet d'une ACL ne contenant que des deny ?",["Tout passe","Tout est bloqué","Rien ne change","Seul le DNS passe"],1,"Sans permit, le deny any implicite bloque tout."],
  ["Une ACL nommée, par rapport à une numérotée…",["Est plus lente","Permet d'éditer des lignes par séquence","Ne filtre que l'IP","N'existe pas"],1,"Les ACL nommées autorisent insertion/suppression par numéro de séquence."],
  ["Combien d'ACL au maximum par interface, par sens et par protocole ?",["1","2","3","illimité"],0,"Une seule par interface, par sens et par protocole."],
  ["Commande pour appliquer une ACL sur une interface ?",["ip access-group","access-class","apply acl","ip filter"],0,"ip access-group <num> {in|out}."],
  ["Le mot-clé host dans une ACL équivaut au wildcard…",["0.0.0.0","255.255.255.255","0.0.0.255","255.0.0.0"],0,"host = une seule adresse = wildcard 0.0.0.0."],
 ]],
};

// Questions type examen CCNA 200-301, niveau DIFFICILE (scénarios, dépannage, calculs avancés).
// Format : [énoncé, [options], index bonne réponse, explication]. (Les options sont mélangées au tirage.)
const HARD={
 vlan:[
  ["SW1 et SW2 sont reliés par un trunk. SW1 a `switchport trunk native vlan 1`, SW2 a `switchport trunk native vlan 99`. Quel symptôme observe-t-on ?",["CDP signale un native VLAN mismatch et le trafic non taggué fuit d'un VLAN à l'autre","Le trunk passe immédiatement en err-disabled","Tous les VLAN cessent de fonctionner","Le switch redémarre"],0,"Un native VLAN mismatch est détecté par CDP ; le trafic du native VLAN peut passer d'un VLAN à l'autre (risque de sécurité)."],
  ["Deux ports reliés sont tous deux en `switchport mode dynamic auto`. Quel est l'état du lien ?",["Access : aucun trunk ne se forme","Trunk 802.1Q","Err-disabled","Routed"],0,"Deux ports en dynamic auto n'initient pas la négociation DTP : le lien reste en mode access."],
  ["Sur un routeur en router-on-a-stick, quelle commande place le VLAN 20 sur la sous-interface Gi0/0.20 ?",["encapsulation dot1q 20","switchport access vlan 20","switchport trunk allowed vlan 20","vlan 20"],0,"Sur une sous-interface, encapsulation dot1q 20 associe le tag ; l'IP de passerelle se met ensuite sur la sous-interface."],
  ["Le mode de violation de port-security par défaut sur un switch Cisco est :",["shutdown : le port passe en err-disabled","protect","restrict","off"],0,"Par défaut la violation déclenche shutdown : le port passe en err-disabled à la première violation."],
  ["Un switch ajouté au domaine VTP avec un numéro de révision plus élevé provoque :",["L'écrasement de la base VLAN de tout le domaine","Aucun effet","Le passage automatique en mode transparent","Une nouvelle élection de root bridge"],0,"Le switch au plus haut numéro de révision propage sa base VLAN : piège VTP classique pouvant effacer des VLAN."],
  ["Quelle attaque exploite le double étiquetage 802.1Q combiné au native VLAN ?",["VLAN hopping (double tagging)","MAC flooding","DHCP starvation","ARP poisoning"],0,"Le double tagging permet de sauter vers un autre VLAN en abusant du native VLAN non taggué."],
  ["Un PC du VLAN 30 n'a aucun accès ; show vlan brief montre son port dans VLAN 1 (port déjà en mode access). Quelle commande corrige ?",["switchport access vlan 30","switchport mode trunk","switchport voice vlan 30","no switchport"],0,"Le port doit être affecté au bon VLAN d'accès : switchport access vlan 30."],
  ["Pour qu'un trunk ne transporte que les VLAN 10, 20 et 30, quelle commande utiliser ?",["switchport trunk allowed vlan 10,20,30","switchport access vlan 10,20,30","switchport trunk native vlan 10,20,30","switchport mode trunk 10,20,30"],0,"switchport trunk allowed vlan 10,20,30 restreint la liste des VLAN autorisés sur le trunk."],
 ],
 routage:[
  ["R1 apprend 192.168.5.0/24 via OSPF (AD 110), EIGRP (AD 90) et RIP (AD 120). Quelle route est installée ?",["EIGRP (AD 90)","OSPF (AD 110)","RIP (AD 120)","Les trois en load-balancing"],0,"À préfixe identique, le routeur choisit la plus faible distance administrative : EIGRP (90)."],
  ["La table contient 10.1.1.0/24 (OSPF) et 10.1.0.0/16 (EIGRP). Vers quelle entrée part un paquet destiné à 10.1.1.50 ?",["10.1.1.0/24 via OSPF (longest match)","10.1.0.0/16 via EIGRP (AD plus faible)","Les deux en partage de charge","Le paquet est rejeté"],0,"Le longest prefix match prime sur l'AD : la route /24 plus spécifique est choisie."],
  ["Segment broadcast OSPF : R1 et R2 ont priority 1, R3 priority 0 ; RID R1=1.1.1.1, R2=2.2.2.2, R3=3.3.3.3. Qui devient DR ?",["R2","R1","R3","Aucun DR n'est élu"],0,"À priorité égale, le plus haut Router-ID l'emporte : R2. R3 (priority 0) ne peut pas être DR/BDR."],
  ["Quelle commande fait annoncer une route par défaut aux voisins OSPF ?",["default-information originate","redistribute static","ip default-network","ip default-gateway 0.0.0.0"],0,"default-information originate injecte la route par défaut dans le processus OSPF."],
  ["Quelle commande active OSPF uniquement sur l'interface d'adresse 10.0.0.1/30 en aire 0 ?",["network 10.0.0.0 0.0.0.3 area 0","network 10.0.0.0 255.255.255.252 area 0","network 10.0.0.1 0.0.0.255 area 0","network 10.0.0.0 0.0.0.252 area 0"],0,"Le wildcard d'un /30 est 0.0.0.3 ; cette commande ne couvre que ce lien."],
  ["Deux routeurs OSPF restent bloqués en état EXSTART/EXCHANGE. Cause la plus probable ?",["MTU mismatch sur les interfaces","Native VLAN mismatch","Distances administratives différentes","Noms d'hôte différents"],0,"Une différence de MTU empêche l'échange des DBD et bloque l'adjacence en EXSTART/EXCHANGE."],
  ["Une route statique flottante vers 0.0.0.0/0 doit servir de secours à la route OSPF par défaut. Quelle AD lui donner ?",["Une AD supérieure à 110 (ex. 200)","0","1","110"],0,"Pour ne servir qu'en secours, la statique flottante doit avoir une AD supérieure à celle d'OSPF (110)."],
  ["Dans EIGRP, le chemin de secours pré-calculé qui satisfait la condition de faisabilité s'appelle :",["Feasible successor","Successor","Stuck-in-active","Designated router"],0,"Le feasible successor est la route de secours déjà calculée, installée immédiatement si le successor tombe."],
 ],
 ip:[
  ["Un segment LAN doit accueillir 500 hôtes. Quel est le masque le plus économique ?",["/23 (510 hôtes)","/24 (254 hôtes)","/22 (1022 hôtes)","/25 (126 hôtes)"],0,"/23 = 2^9 - 2 = 510 hôtes, le plus petit masque couvrant 500 hôtes."],
  ["192.168.10.0/24 découpé en /27 : combien de sous-réseaux et d'hôtes chacun ?",["8 sous-réseaux de 30 hôtes","4 sous-réseaux de 62 hôtes","16 sous-réseaux de 14 hôtes","2 sous-réseaux de 126 hôtes"],0,"/27 emprunte 3 bits : 2^3 = 8 sous-réseaux, 2^5 - 2 = 30 hôtes chacun."],
  ["À quel sous-réseau appartient l'hôte 192.168.10.66/26 ?",["192.168.10.64/26","192.168.10.0/26","192.168.10.32/27","192.168.10.96/26"],0,"Bloc /26 de 64 : 66 tombe dans 64–127, donc réseau 192.168.10.64."],
  ["Plage d'adresses utilisables du réseau contenant 172.16.5.130/26 ?",["172.16.5.129 à 172.16.5.190","172.16.5.128 à 172.16.5.191","172.16.5.130 à 172.16.5.254","172.16.5.65 à 172.16.5.126"],0,"Réseau 172.16.5.128/26 : hôtes 129–190, broadcast 191."],
  ["Depuis 172.16.0.0/16, quel masque donne au moins 1000 sous-réseaux ?",["/26","/25","/27","/24"],0,"Il faut 10 bits empruntés (2^10 = 1024 ≥ 1000) : /16 + 10 = /26."],
  ["Avec EUI-64 et la MAC 00:1A:2B:3C:4D:5E, quel est l'identifiant d'interface IPv6 ?",["021A:2BFF:FE3C:4D5E","001A:2BFF:FE3C:4D5E","001A:2B3C:4D5E:FFFE","021A:2B3C:FFFE:4D5E"],0,"EUI-64 insère FFFE au milieu et inverse le 7e bit : 00 devient 02 → 021A:2BFF:FE3C:4D5E."],
  ["Quelle est la dernière adresse utilisable de 10.10.10.0/30 ?",["10.10.10.2","10.10.10.3","10.10.10.1","10.10.10.4"],0,"/30 : réseau .0, hôtes .1 et .2, broadcast .3. Dernière utilisable = .2."],
  ["Combien de liaisons point à point /30 peut-on créer dans un seul /24 ?",["64","32","16","128"],0,"256 / 4 = 64 sous-réseaux /30, un par liaison point à point."],
 ],
 osi:[
  ["Dans quel ordre les en-têtes sont-ils ajoutés pour envoyer une requête HTTP sur Ethernet ?",["Données → en-tête TCP → en-tête IP → en-tête Ethernet","En-tête Ethernet → IP → TCP → Données","IP → TCP → Ethernet → Données","TCP → IP → Données → Ethernet"],0,"L'encapsulation descend les couches : segment (TCP), puis paquet (IP), puis trame (Ethernet)."],
  ["Quel est l'ordre des drapeaux lors de l'établissement d'une connexion TCP ?",["SYN, SYN-ACK, ACK","SYN, ACK, FIN","ACK, SYN, ACK","SYN-ACK, ACK, SYN"],0,"Le three-way handshake TCP : SYN, puis SYN-ACK, puis ACK."],
  ["Un routeur retire l'en-tête de liaison, choisit le chemin selon l'IP, puis ré-encapsule dans une nouvelle trame. Cela illustre :",["La décapsulation/ré-encapsulation à chaque saut L3","La commutation de couche 2","Le NAT","Le proxy ARP"],0,"À chaque saut routé, l'en-tête L2 est réécrit alors que l'en-tête IP de bout en bout reste (hors NAT)."],
  ["Quel protocole de transport, sans connexion, est privilégié pour la VoIP, le DNS et le TFTP ?",["UDP","TCP","SCTP","ICMP"],0,"UDP, sans établissement ni retransmission, convient au temps réel et aux échanges courts."],
  ["Quelle association protocole / port de transport est correcte ?",["HTTPS = TCP 443","SSH = UDP 22","SNMP = TCP 161","DNS = TCP 53 uniquement"],0,"HTTPS = TCP 443. SSH = TCP 22, SNMP = UDP 161, DNS = 53 (UDP en priorité)."],
  ["À quelle couche OSI opère principalement un pare-feu qui filtre par numéro de port TCP/UDP ?",["Couche 4 (Transport)","Couche 3 (Réseau)","Couche 7 (Application)","Couche 2 (Liaison)"],0,"Le filtrage par numéro de port relève de la couche 4 (Transport)."],
  ["Quel champ de l'en-tête IPv4 est décrémenté à chaque routeur pour éviter les boucles ?",["TTL","Checksum","Flags","Type of Service"],0,"Le TTL est décrémenté à chaque saut ; à 0 le paquet est rejeté (ICMP time exceeded)."],
  ["Quelle PDU correspond à la couche Transport et quel adressage utilise-t-elle ?",["Segment, adressage par numéros de port","Paquet, adressage IP","Trame, adressage MAC","Bit, aucun adressage"],0,"La couche 4 produit des segments adressés par ports source et destination."],
 ],
 acl:[
  ["L'entrée `permit tcp 192.168.1.0 0.0.0.255 any eq 80` autorise quel trafic ?",["Le HTTP issu du réseau 192.168.1.0/24 vers n'importe quelle destination","Le HTTP vers 192.168.1.0/24","Tout le TCP de 192.168.1.0/24","Le HTTPS depuis 192.168.1.0/24"],0,"Source 192.168.1.0/24, destination any, port destination 80 : HTTP sortant de ce réseau."],
  ["Une ACL contient `10 permit ip any any` puis `20 deny tcp any any eq 23`. Le Telnet est-il bloqué ?",["Non : la ligne 10 (permit any) matche avant la ligne 20","Oui, le deny s'applique","Seulement en entrée","Seulement le Telnet sortant"],0,"L'ACL s'évalue de haut en bas au premier match : permit ip any any autorise tout avant d'atteindre le deny."],
  ["Quelle ACL standard bloque exactement le réseau 172.16.16.0/20 ?",["access-list 10 deny 172.16.16.0 0.0.15.255","access-list 10 deny 172.16.16.0 0.0.255.255","access-list 10 deny 172.16.16.0 0.0.0.255","access-list 10 deny 172.16.16.0 0.0.7.255"],0,"Le wildcard d'un /20 est 0.0.15.255 (12 bits hôtes à 1)."],
  ["Où placer une ACL étendue qui bloque le HTTP de PC-A vers le serveur B ?",["En entrée de l'interface la plus proche de PC-A","En sortie près du serveur B","Sur l'interface de loopback","Indifféremment"],0,"Une ACL étendue se place au plus près de la source pour rejeter le trafic au plus tôt."],
  ["Effet de `access-list 100 permit tcp any any established` ?",["Autoriser le TCP de retour des sessions initiées de l'intérieur","Bloquer tout le TCP","Autoriser tout l'UDP","Ouvrir tous les ports entrants"],0,"established ne laisse passer que les segments TCP avec ACK/RST, donc les réponses à des sessions déjà ouvertes."],
  ["Quelle commande applique l'ACL 10 au filtrage des connexions VTY (Telnet/SSH) ?",["access-class 10 in (sous line vty)","ip access-group 10 in","access-list vty 10","login access 10"],0,"Les lignes VTY se protègent avec access-class sous line vty, pas ip access-group."],
  ["Dans une ACL, l'ordre des entrées importe car :",["L'évaluation s'arrête au premier match, de haut en bas","Les entrées sont triées par spécificité automatiquement","Seule la dernière entrée compte","L'ordre est sans effet"],0,"Une ACL est séquentielle : la première règle qui matche est appliquée, les suivantes sont ignorées."],
  ["Une interface a `ip access-group 101 in` et l'ACL 101 ne contient qu'un permit tcp ... eq 22. Que devient le reste du trafic entrant ?",["Il est rejeté par le deny any implicite","Il est autorisé","Il est routé sans filtrage","Il est seulement journalisé"],0,"Toute ACL se termine par un deny any implicite : tout ce qui n'est pas explicitement permis est rejeté."],
 ],
};

// Questions supplementaires couvrant le blueprint CCNA 200-301 (tous niveaux).
// Format : [énoncé, [options], index bonne réponse, explication, niveau(1=facile,2=moyen,3=difficile)].
const MORE={
 vlan:[
  ["Quel commutateur devient root bridge en STP ?",["Celui qui a le plus faible Bridge ID (priorité puis MAC)","Celui qui a la plus grande MAC","Le premier allumé","Celui avec le plus de ports"],0,"Le root bridge est élu sur le plus petit Bridge ID = priorité puis adresse MAC.",2],
  ["Priorité de pont STP par défaut sur un switch Cisco ?",["32768","0","4096","65535"],0,"La priorité par défaut est 32768 (modifiable par pas de 4096).",2],
  ["Quels sont les états de port en RSTP (802.1w) ?",["Discarding, Learning, Forwarding","Blocking, Listening, Learning, Forwarding, Disabled","Up, Down","Active, Passive"],0,"RSTP simplifie à 3 états : Discarding, Learning, Forwarding.",3],
  ["Quel protocole d'agrégation de liens est le standard IEEE 802.3ad ?",["LACP","PAgP","STP","VTP"],0,"LACP est le standard ouvert ; PAgP est propriétaire Cisco.",2],
  ["Quel protocole de découverte de voisins est propriétaire Cisco ?",["CDP","LLDP","ARP","ICMP"],0,"CDP est propriétaire Cisco ; LLDP (802.1AB) est le standard ouvert.",1],
  ["Que fait `switchport port-security mac-address sticky` ?",["Apprend dynamiquement les MAC et les enregistre dans la configuration","Bloque toutes les MAC","Efface la table MAC","Active un trunk"],0,"Les MAC apprises sont collées (sticky) dans la running-config.",2],
  ["À quoi sert PortFast et où l'activer ?",["Sur les ports d'accès vers les hôtes, pour passer directement en forwarding","Sur les trunks entre switches","Sur les ports routés","Sur les ports éteints"],0,"PortFast évite les délais STP sur les ports d'accès terminaux (à protéger par BPDU Guard).",3],
  ["Quel est le rôle du root port sur un switch non-root ?",["Le port de plus faible coût vers le root bridge","Le port qui bloque le trafic","Le port vers les hôtes","Le port de management"],0,"Le root port est le meilleur chemin (coût le plus faible) vers le root bridge.",2],
  ["Une table d'adresses MAC (CAM) associe une adresse MAC à :",["Un port du switch","Une adresse IP","Un VLAN natif","Une route"],0,"Le switch apprend la MAC source et l'associe au port d'arrivée.",1],
  ["Quelle fonctionnalité bloque les BPDU reçues sur un port d'accès PortFast ?",["BPDU Guard","Root Guard","DHCP Snooping","Storm Control"],0,"BPDU Guard met le port en err-disabled s'il reçoit une BPDU, protégeant la topologie STP.",3],
 ],
 routage:[
  ["Commande pour une route statique par défaut via 203.0.113.1 ?",["ip route 0.0.0.0 0.0.0.0 203.0.113.1","ip route default 203.0.113.1","ip default-network 203.0.113.1","route add default 203.0.113.1"],0,"ip route 0.0.0.0 0.0.0.0 <next-hop> crée la route par défaut.",1],
  ["Intervalle Hello OSPF par défaut sur un réseau broadcast (et Dead associé) ?",["10 s (Dead 40 s)","30 s (Dead 120 s)","5 s (Dead 20 s)","60 s (Dead 240 s)"],0,"Sur broadcast : Hello 10 s, Dead 40 s (4x Hello). Ils doivent concorder entre voisins.",2],
  ["Que fait la commande `passive-interface` en OSPF ?",["Annonce le réseau mais n'envoie pas de Hello sur l'interface","Désactive l'interface","Bloque le routage","Force l'élection DR"],0,"L'interface est annoncée dans OSPF mais n'établit pas d'adjacence (utile vers les LAN d'accès).",2],
  ["HSRP : quel routeur devient actif ?",["Le routeur de plus haute priorité (puis plus haute IP)","Celui avec la plus faible IP","Le premier configuré","Le routeur de plus faible priorité"],0,"HSRP élit l'actif sur la priorité la plus élevée, départage par l'IP la plus haute.",3],
  ["À quoi sert l'adresse IP virtuelle HSRP ?",["Servir de passerelle par défaut redondante aux hôtes","Identifier le switch root","Adresser le serveur DHCP","Numéroter le VLAN"],0,"Les hôtes pointent vers l'IP virtuelle ; le routeur actif y répond, avec bascule sur le standby.",2],
  ["Quelle commande affiche les voisins OSPF et leur état ?",["show ip ospf neighbor","show ip route ospf","show ip protocols","show ospf interface"],0,"show ip ospf neighbor liste les voisins, leur état (FULL/2WAY...) et le rôle DR/BDR.",1],
  ["Deux routes OSPF de coûts égaux vers la même destination : que fait le routeur ?",["Partage de charge (ECMP) sur les deux chemins","Garde une seule route","Rejette les deux","Augmente l'AD"],0,"OSPF installe jusqu'à plusieurs chemins de coût égal (ECMP) pour répartir la charge.",3],
  ["Type de réseau OSPF par défaut sur une interface Ethernet ?",["Broadcast (avec élection DR/BDR)","Point-à-point","Non-broadcast","Point-à-multipoint"],0,"Sur Ethernet, OSPF est en mode broadcast et élit un DR/BDR.",2],
  ["Commande pour une route statique vers 10.0.0.0/24 via 192.168.1.2 ?",["ip route 10.0.0.0 255.255.255.0 192.168.1.2","ip route 10.0.0.0 0.0.0.255 192.168.1.2","ip route 10.0.0.0/24 192.168.1.2","route 10.0.0.0 255.255.255.0 192.168.1.2"],0,"La syntaxe IOS attend le masque décimal : ip route 10.0.0.0 255.255.255.0 192.168.1.2.",1],
  ["Sur une liaison multi-accès, pourquoi préférer un next-hop IP à une interface de sortie pour une route statique ?",["Pour éviter les problèmes de résolution ARP/recursion","Parce que c'est plus rapide","Parce que l'interface est obligatoire","Pour réduire l'AD"],0,"Sur multi-accès, l'interface seule oblige une résolution ARP de toutes les destinations ; le next-hop est plus fiable.",3],
 ],
 ip:[
  ["Quel préfixe identifie les adresses IPv6 globales unicast (GUA) ?",["2000::/3","fc00::/7","fe80::/10","ff00::/8"],0,"Les GUA routables sur Internet sont dans 2000::/3.",2],
  ["Quel préfixe correspond aux adresses IPv6 unique local (ULA) ?",["fc00::/7","2000::/3","fe80::/10","::1/128"],0,"Les ULA (équivalent du privé) sont dans fc00::/7.",2],
  ["Quel est l'ordre des messages DHCP ?",["Discover, Offer, Request, Ack (DORA)","Request, Offer, Discover, Ack","Offer, Discover, Ack, Request","Hello, Offer, Ack"],0,"Le cycle DHCP est DORA : Discover, Offer, Request, Acknowledge.",1],
  ["PAT (NAT overload) distingue les multiples sessions internes grâce à :",["Aux numéros de port source","À l'adresse MAC","Au VLAN","Au TTL"],0,"PAT multiplexe plusieurs IP privées sur une IP publique en suivant les ports source.",3],
  ["Quel type de NAT associe une IP privée à une IP publique en 1:1 fixe ?",["NAT statique","PAT","NAT dynamique","CGNAT"],0,"Le NAT statique crée un mappage permanent 1:1, utile pour exposer un serveur.",2],
  ["Quel est le rôle d'un serveur DNS ?",["Résoudre les noms de domaine en adresses IP","Attribuer des adresses IP","Router les paquets","Synchroniser l'heure"],0,"Le DNS traduit les noms (ex. www.site.com) en adresses IP.",1],
  ["En NTP, que signifie un stratum plus bas ?",["Plus proche de la source de temps de référence (plus fiable)","Une horloge moins précise","Un fuseau horaire négatif","Un serveur de secours"],0,"Le stratum 1 est directement relié à une source précise ; le numéro augmente avec la distance.",2],
  ["Adresse IPv6 multicast de tous les routeurs du lien ?",["ff02::2","ff02::1","ff02::5","fe80::1"],0,"ff02::2 = tous les routeurs ; ff02::1 = tous les nœuds du lien.",3],
  ["Que permet SLAAC en IPv6 ?",["À l'hôte de générer son adresse à partir du préfixe annoncé (RA)","D'obtenir une IP via un bail DHCP","De router automatiquement","De chiffrer le trafic"],0,"Avec SLAAC, l'hôte forme son adresse à partir du préfixe du Router Advertisement (souvent via EUI-64).",2],
  ["Forme abrégée correcte de 2001:0db8:0000:0000:0000:0000:0000:0001 ?",["2001:db8::1","2001:db8::0001:0","2001:db8:0:1::","21:db8::1"],0,"On supprime les zéros de tête et on remplace un seul groupe de zéros consécutifs par :: → 2001:db8::1.",1],
 ],
 osi:[
  ["Entre TCP et UDP, lequel garantit la livraison ordonnée et la retransmission ?",["TCP","UDP","ICMP","ARP"],0,"TCP est fiable (accusés, retransmission, ordre) ; UDP est sans connexion.",1],
  ["Quel mécanisme TCP régule le débit selon ce que le récepteur peut absorber ?",["Le fenêtrage (windowing)","Le split horizon","Le TTL","Le checksum"],0,"La fenêtre TCP (window) ajuste la quantité de données envoyées avant accusé.",2],
  ["Port well-known du canal de contrôle FTP ?",["21","20","22","69"],0,"FTP utilise TCP 21 pour le contrôle (et 20 pour les données en mode actif).",2],
  ["Un hôte envoie vers une IP située hors de son sous-réseau. Quelle MAC met-il en destination de la trame ?",["La MAC de sa passerelle par défaut","La MAC du serveur distant","FF:FF:FF:FF:FF:FF","Sa propre MAC"],0,"Hors sous-réseau, la trame est adressée à la MAC de la passerelle, qui routera ensuite.",3],
  ["Que fait un switch d'une trame dont la MAC destination est inconnue (unknown unicast) ?",["Il l'inonde sur tous les ports sauf celui d'entrée","Il la rejette","Il la renvoie à l'émetteur","Il la met en file d'attente"],0,"En l'absence d'entrée dans la table CAM, le switch inonde la trame (flooding).",2],
  ["Une adresse MAC fait 48 bits : que représentent les 24 premiers bits ?",["L'OUI, identifiant du fabricant","Le numéro de série complet","L'adresse IP","Le VLAN"],0,"Les 24 premiers bits sont l'OUI (fabricant), les 24 suivants sont propres à la carte.",1],
  ["Quel port well-known utilise SSH ?",["22","23","443","80"],0,"SSH = TCP 22 ; Telnet (non chiffré) = 23.",1],
  ["À quoi sert un ARP gratuit (gratuitous ARP) ?",["Annoncer/mettre à jour sa propre association IP-MAC (et détecter les doublons)","Résoudre une IP distante","Demander une IP au DHCP","Router un paquet"],0,"L'hôte émet un ARP pour sa propre IP, ce qui met à jour les caches et détecte les conflits d'adresse.",3],
  ["Quelle couche segmente les données et les adresse par numéros de port ?",["Transport (4)","Réseau (3)","Liaison (2)","Session (5)"],0,"La couche Transport segmente et multiplexe via les ports source/destination.",1],
  ["Quelle est la plage des ports dynamiques/éphémères selon l'IANA ?",["49152–65535","0–1023","1024–49151","1–1024"],0,"Well-known 0–1023, enregistrés 1024–49151, dynamiques 49152–65535.",2],
 ],
 acl:[
  ["Avantage d'une ACL nommée par rapport à une ACL numérotée ?",["On peut éditer des lignes par numéro de séquence","Elle est plus rapide","Elle filtre aussi la MAC","Elle n'a pas de deny implicite"],0,"Les ACL nommées permettent l'insertion/suppression de lignes par séquence sans tout recréer.",2],
  ["Contre quelle menace DHCP snooping protège-t-il ?",["Les serveurs DHCP pirates (rogue)","Le MAC flooding","Les boucles STP","Le VLAN hopping"],0,"DHCP snooping n'autorise les réponses DHCP que sur les ports de confiance, bloquant les serveurs pirates.",3],
  ["Quel protocole AAA chiffre l'intégralité du paquet et sépare l'autorisation de l'authentification ?",["TACACS+","RADIUS","Kerberos","LDAP"],0,"TACACS+ (Cisco) chiffre tout le payload et sépare AAA ; RADIUS ne chiffre que le mot de passe.",2],
  ["Que signifie AAA en sécurité réseau ?",["Authentication, Authorization, Accounting","Access, Audit, Alert","Authentication, Access, Accounting","Authorization, Auditing, Access"],0,"AAA = Authentification, Autorisation, Traçabilité (Accounting).",1],
  ["Sur quelle table s'appuie le Dynamic ARP Inspection (DAI) ?",["La table de liaison (binding) du DHCP snooping","La table de routage","La table CAM","La table VLAN"],0,"DAI vérifie les paires IP-MAC via la binding table construite par DHCP snooping.",3],
  ["Lequel est le plus sûr pour protéger le mode privilégié ?",["enable secret (mot de passe haché)","enable password (clair)","service password-encryption (type 7 réversible)","mot de passe console"],0,"enable secret stocke un hachage ; le type 7 de password-encryption est facilement réversible.",3],
  ["Sens et placement recommandés d'une ACL étendue qui bloque un flux précis ?",["En entrée, au plus près de la source","En sortie, près de la destination","Sur une loopback","Sur le port console"],0,"L'ACL étendue se place près de la source pour rejeter le trafic au plus tôt.",2],
  ["Quelle commande applique une ACL à une interface (trafic IP) ?",["ip access-group","access-class","ip filter","apply acl"],0,"ip access-group <num|nom> {in|out} applique l'ACL à l'interface ; access-class sert aux lignes VTY.",1],
  ["Avec port-security, que fait l'action de violation `restrict` ?",["Rejette le trafic en excès et incrémente un compteur, sans fermer le port","Ferme le port (err-disabled)","Ignore la violation silencieusement","Réinitialise le switch"],0,"restrict rejette les trames non autorisées et journalise, mais laisse le port actif (contrairement à shutdown).",2],
  ["Quel mot-clé d'ACL étendue n'autorise que le trafic TCP de retour de sessions déjà ouvertes ?",["established","permit","reflexive","dynamic"],0,"established matche les segments TCP avec ACK/RST, donc les réponses aux sessions initiées de l'intérieur.",3],
 ],
};

// Questions EXPERT (niveau difficile pur) : calculs multi-étapes et scénarios pointus CCNA 200-301.
const EXPERT={
 vlan:[
  ["Selon la table de coûts STP courte (IEEE 802.1D), quel est le coût d'un lien Gigabit Ethernet ?",["4","19","2","100"],0,"Coûts courts STP : 10 Gbps = 2, 1 Gbps = 4, 100 Mbps = 19, 10 Mbps = 100.",3],
  ["Coûts cumulés vers le root bridge : Fa0/1 = 19, Gi0/1 = 8, Gi0/2 = 12. Quel port devient root port ?",["Gi0/1","Gi0/2","Fa0/1","Aucun"],0,"Le root port est celui de plus faible coût cumulé vers le root : Gi0/1 (8).",3],
  ["Avec LACP, quelles combinaisons de modes forment un EtherChannel ?",["active-active ou active-passive","passive-passive","on-active","auto-desirable"],0,"LACP exige au moins un côté active ; passive-passive ne négocie jamais. on et auto/desirable relèvent d'autres modes.",3],
  ["Quelle paire de modes DTP ne forme PAS de trunk ?",["dynamic auto / dynamic auto","trunk / dynamic auto","dynamic desirable / dynamic auto","trunk / trunk"],0,"Deux ports en dynamic auto attendent passivement : aucun trunk ne se forme.",3],
  ["Quelle commande globale active BPDU Guard sur tous les ports PortFast ?",["spanning-tree portfast bpduguard default","spanning-tree bpduguard enable","spanning-tree portfast default","bpduguard all"],0,"spanning-tree portfast bpduguard default applique BPDU Guard à tous les ports PortFast.",3],
  ["Quelle commande force un switch à devenir root primaire pour le VLAN 10 ?",["spanning-tree vlan 10 root primary","spanning-tree vlan 10 priority 32768","spanning-tree root vlan 10","set spanning-tree root 10"],0,"root primary abaisse la priorité (24576 ou moins) pour gagner l'élection du root bridge.",3],
  ["Bonne pratique pour sécuriser le VLAN natif d'un trunk ?",["L'affecter à un VLAN inutilisé et taguer le natif (vlan dot1q tag native)","Le laisser en VLAN 1","Le mettre dans le VLAN de management","Le désactiver"],0,"Mettre le natif sur un VLAN inutilisé et le taguer contre-mesure le VLAN hopping par double tagging.",3],
  ["Un téléphone IP et un PC partagent un port. Pourquoi configurer `switchport port-security maximum 2` ?",["Pour autoriser la MAC du PC et celle du téléphone","Pour doubler la bande passante","Pour activer le trunk","Pour créer deux VLAN natifs"],0,"Le port voit deux MAC (PC + téléphone via voice VLAN) ; le maximum doit donc valoir 2.",3],
  ["Un EtherChannel reste down : les ports membres ont des listes de VLAN autorisés différentes. Cause ?",["Incohérence de configuration entre membres du bundle","MTU trop élevé","VLAN natif identique","Câble croisé"],0,"Tous les membres d'un EtherChannel doivent avoir une config identique (mode, VLAN autorisés, natif), sinon le bundle ne monte pas.",3],
  ["Quelle est la différence d'états de port entre STP (802.1D) et RSTP (802.1w) ?",["STP a 5 états (dont blocking/listening), RSTP en a 3 (discarding/learning/forwarding)","RSTP a plus d'états que STP","Ils ont les mêmes états","RSTP n'a pas d'état forwarding"],0,"RSTP fusionne disabled/blocking/listening en un seul état discarding.",3],
 ],
 routage:[
  ["Référence OSPF par défaut (100 Mbps). Un chemin traverse trois liens Gigabit en série. Coût OSPF total ?",["3","1","30","300"],0,"Coût d'un lien Gig = 10^8/10^9 = 0,1 arrondi au minimum 1 ; trois liens → 3.",3],
  ["Avec la reference-bandwidth par défaut (100 Mbps), quel problème pose un lien 10 Gbps ?",["Son coût vaut 1, comme un lien 100 Mbps ou Gigabit : OSPF ne distingue plus les hauts débits","Son coût est négatif","OSPF refuse l'interface","Le coût devient 10000"],0,"10^8/10^10 < 1 → arrondi à 1, identique aux liens ≥ 100 Mbps. D'où l'intérêt d'augmenter la reference-bandwidth.",3],
  ["Quelles métriques EIGRP sont utilisées par défaut (valeurs K) ?",["Bande passante et délai (K1=1, K3=1)","Sauts uniquement","Charge et fiabilité","Coût comme OSPF"],0,"Par défaut EIGRP n'utilise que bande passante (K1) et délai (K3).",3],
  ["Quelle est la condition de faisabilité (FC) en EIGRP ?",["La distance reportée du voisin (RD) est inférieure à la distance faisable (FD) du successor","La RD est supérieure à la FD","Les métriques sont égales","Le voisin a la plus haute IP"],0,"Un feasible successor doit avoir une RD < FD du successor, garantissant l'absence de boucle.",3],
  ["Quel type de LSA un ABR génère-t-il pour annoncer des réseaux d'une autre aire ?",["Type 3 (Summary LSA)","Type 1 (Router LSA)","Type 2 (Network LSA)","Type 5 (External LSA)"],0,"L'ABR émet des LSA de type 3 (Summary) pour propager les routes inter-aires.",3],
  ["Dans une aire stub OSPF, quels LSA sont bloqués ?",["Les LSA externes de type 5 (remplacés par une route par défaut)","Les LSA de type 1","Les LSA de type 2","Aucun"],0,"Une aire stub n'accepte pas les type 5 ; l'ABR y injecte une route par défaut à la place.",3],
  ["Résumé le plus précis couvrant 192.168.0.0/24 à 192.168.3.0/24 ?",["192.168.0.0/22","192.168.0.0/23","192.168.0.0/21","192.168.0.0/24"],0,"Quatre /24 contigus (0–3) s'agrègent en un /22.",3],
  ["Résumé couvrant 10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16 et 10.3.0.0/16 ?",["10.0.0.0/14","10.0.0.0/15","10.0.0.0/16","10.0.0.0/13"],0,"Quatre /16 contigus (0–3) s'agrègent en un /14.",3],
  ["Distance administrative d'une route eBGP ?",["20","200","110","1"],0,"eBGP = 20 (préféré à l'IGP), iBGP = 200.",3],
  ["AD d'une route OSPF inter-aires comparée à une route OSPF externe E2 ?",["Les deux valent 110","Inter-aires 110, externe 150","Inter-aires 110, externe 20","Externe 110, inter-aires 200"],0,"Toutes les routes OSPF (intra, inter, externes) ont une AD de 110 par défaut.",3],
 ],
 ip:[
  ["Plus petit résumé couvrant 172.16.8.0/24 à 172.16.15.0/24 ?",["172.16.8.0/21","172.16.8.0/20","172.16.8.0/22","172.16.0.0/21"],0,"Huit /24 contigus (8–15) s'agrègent en un /21.",3],
  ["Un sous-réseau doit accueillir exactement 50 hôtes. Masque le plus économique ?",["/26 (62 hôtes)","/27 (30 hôtes)","/25 (126 hôtes)","/28 (14 hôtes)"],0,"/27 ne donne que 30 hôtes ; il faut /26 (2^6 - 2 = 62).",3],
  ["Adresse réseau de 10.5.130.200/22 ?",["10.5.128.0","10.5.130.0","10.5.132.0","10.5.0.0"],0,"/22 → bloc de 4 dans le 3e octet ; 130 tombe dans 128–131 → réseau 10.5.128.0.",3],
  ["Adresse de broadcast de 10.5.130.200/22 ?",["10.5.131.255","10.5.130.255","10.5.132.255","10.5.128.255"],0,"Réseau 10.5.128.0/22 → plage 128–131, broadcast 10.5.131.255.",3],
  ["Combien d'hôtes utilisables dans un /22 ?",["1022","1024","510","2046"],0,"2^10 - 2 = 1022 hôtes.",3],
  ["De quelle MAC provient l'identifiant EUI-64 0250:56FF:FE3A:1C2B ?",["00:50:56:3A:1C:2B","02:50:56:3A:1C:2B","00:50:56:FF:3A:2B","50:56:3A:1C:2B:FF"],0,"On retire FFFE et on inverse le 7e bit : 02 redevient 00 → 00:50:56:3A:1C:2B.",3],
  ["Adresse multicast de nœud sollicité associée à 2001:db8::ab:cd12:3456 ?",["ff02::1:ff12:3456","ff02::1:ffcd:1234","ff02::1:ab:3456","ff02::ff12:3456"],0,"Le multicast de nœud sollicité reprend les 24 derniers bits : ff02::1:ff12:3456.",3],
  ["Masque pour découper un /24 en sous-réseaux de 6 hôtes utilisables au plus juste ?",["/29","/28","/30","/27"],0,"/29 = 2^3 - 2 = 6 hôtes utilisables.",3],
  ["Combien de sous-réseaux /29 tiennent dans un /24 ?",["32","16","8","64"],0,"/24 → /29 emprunte 5 bits : 2^5 = 32 sous-réseaux.",3],
  ["Combien de sous-réseaux /26 et combien d'hôtes obtient-on d'un /23 ?",["8 sous-réseaux de 62 hôtes","4 sous-réseaux de 62 hôtes","8 sous-réseaux de 30 hôtes","16 sous-réseaux de 14 hôtes"],0,"De /23 à /26 = 3 bits empruntés → 2^3 = 8 sous-réseaux, chacun 2^6 - 2 = 62 hôtes.",3],
 ],
 osi:[
  ["MTU Ethernet de 1500 octets, en-têtes IP + TCP de 40 octets : quel est le MSS TCP ?",["1460","1500","1480","1420"],0,"MSS = MTU - en-têtes IP (20) - TCP (20) = 1460 octets.",3],
  ["Un hôte envoie un SYN avec numéro de séquence 1000. Quel numéro d'accusé (ack) renvoie le serveur dans le SYN-ACK ?",["1001","1000","1002","2000"],0,"L'ack confirme le prochain octet attendu : seq + 1 = 1001.",3],
  ["Dans quel état se trouve une socket TCP après l'envoi du SYN, en attente du SYN-ACK ?",["SYN-SENT","SYN-RECEIVED","ESTABLISHED","LISTEN"],0,"Le client passe en SYN-SENT jusqu'à réception du SYN-ACK.",3],
  ["Taille de l'en-tête UDP ?",["8 octets","20 octets","12 octets","16 octets"],0,"L'en-tête UDP fait 8 octets (ports source/dest, longueur, checksum).",3],
  ["Entre deux routeurs successifs, qu'est-ce qui change dans l'en-tête à chaque saut ?",["Les adresses MAC source/destination (L2), les IP de bout en bout restent","Les adresses IP, les MAC restent","Rien ne change","Le numéro de port"],0,"À chaque saut routé, l'en-tête L2 est réécrit ; les IP source/destination restent (hors NAT).",3],
  ["Combien d'entrées ARP un PC crée-t-il pour communiquer avec 5 serveurs situés sur un autre réseau ?",["1 (la MAC de la passerelle)","5","6","0"],0,"Pour des destinations hors sous-réseau, l'hôte n'a besoin que de la MAC de sa passerelle.",3],
  ["Quel message ICMP un routeur renvoie-t-il lorsque le TTL d'un paquet atteint 0 ?",["Time Exceeded (type 11)","Destination Unreachable (type 3)","Echo Reply (type 0)","Redirect (type 5)"],0,"TTL expiré → ICMP Time Exceeded (type 11), base du fonctionnement de traceroute.",3],
  ["Quel champ TCP permet de réassembler les segments dans le bon ordre ?",["Le numéro de séquence","Le numéro de port","La somme de contrôle","Le TTL"],0,"Le numéro de séquence ordonne les octets pour le réassemblage côté récepteur.",3],
  ["Quel mécanisme TCP réduit la fenêtre après détection de pertes pour éviter la congestion ?",["Le contrôle de congestion (slow start / congestion avoidance)","Le split horizon","Le three-way handshake","Le contrôle de parité"],0,"TCP réduit sa fenêtre de congestion (cwnd) et repart en slow start après des pertes.",3],
  ["Pourquoi UDP est-il préféré à TCP pour la VoIP malgré l'absence de retransmission ?",["La retransmission ajouterait de la latence et de la gigue, néfastes au temps réel","UDP est chiffré","UDP garantit l'ordre","UDP utilise moins de ports"],0,"En temps réel, mieux vaut perdre un paquet que d'attendre sa retransmission : UDP évite la latence.",3],
 ],
 acl:[
  ["ACL étendue autorisant HTTPS de 10.1.1.0/24 vers le seul serveur 172.16.5.10 ?",["access-list 110 permit tcp 10.1.1.0 0.0.0.255 host 172.16.5.10 eq 443","access-list 10 permit tcp 10.1.1.0 0.0.0.255 eq 443","access-list 110 permit ip 10.1.1.0 0.0.0.255 host 172.16.5.10","access-list 110 permit tcp host 172.16.5.10 10.1.1.0 0.0.0.255 eq 443"],0,"Source réseau, destination host, port destination 443 : une ACL étendue (100-199) est nécessaire.",3],
  ["Pour bloquer un hôte précis mais autoriser le reste de son réseau, dans quel ordre placer les entrées ?",["Le deny host AVANT le permit du réseau","Le permit du réseau avant le deny host","Peu importe l'ordre","Deux ACL séparées sont obligatoires"],0,"L'ACL s'arrête au premier match : le deny spécifique doit précéder le permit plus large.",3],
  ["Quelle commande renumérote les séquences d'une ACL nommée ?",["ip access-list resequence","access-list renumber","resequence acl","ip acl sequence"],0,"ip access-list resequence <nom> <début> <pas> réattribue les numéros de séquence.",3],
  ["En DHCP snooping, quels ports faut-il déclarer 'trusted' ?",["Ceux menant au serveur DHCP légitime (uplinks)","Tous les ports d'accès","Aucun","Les ports vers les PC"],0,"Seuls les ports vers le serveur DHCP légitime sont trusted ; les autres bloquent les réponses DHCP.",3],
  ["Une ACL appliquée en `in` sur une interface filtre le trafic :",["Entrant dans l'interface, avant la décision de routage","Sortant de l'interface, après routage","Dans les deux sens","Uniquement le trafic local au routeur"],0,"Une ACL 'in' est évaluée à l'entrée de l'interface, avant le routage.",3],
  ["Différence clé entre le mot-clé `established` et une ACL réflexive ?",["established ne teste que les bits ACK/RST ; la réflexive crée des entrées dynamiques par session","Elles sont identiques","La réflexive ne marche qu'en UDP","established crée des sessions dynamiques"],0,"established est statique (bits TCP) ; une ACL réflexive génère des permis temporaires basés sur les sessions sortantes.",3],
  ["Wildcard permettant de matcher d'un seul coup les réseaux 192.168.0.0/24 à 192.168.7.0/24 ?",["192.168.0.0 0.0.7.255","192.168.0.0 0.0.255.255","192.168.0.0 0.0.0.255","192.168.0.0 0.0.3.255"],0,"Huit /24 (0–7) = un bloc /21 → wildcard 0.0.7.255.",3],
  ["Que se passe-t-il si on applique une ACL inexistante (vide) à une interface avec `ip access-group 50 in` ?",["Tout le trafic passe (une ACL vide n'a pas de deny implicite actif)","Tout est bloqué","L'interface tombe","Erreur de configuration"],0,"Une ACL référencée mais non définie n'a aucune entrée : le deny implicite ne s'applique pas, tout passe.",3],
  ["Quel protocole AAA permet une autorisation granulaire par commande (command authorization) ?",["TACACS+","RADIUS","SNMP","Kerberos"],0,"TACACS+ sépare l'autorisation et gère le contrôle par commande, contrairement à RADIUS.",3],
  ["Effet de `switchport port-security violation protect` lors d'une violation ?",["Le trafic en excès est silencieusement rejeté, sans journalisation ni compteur","Le port passe en err-disabled","Un log et un compteur sont générés","Le switch redémarre"],0,"protect rejette les trames non autorisées sans alerter (ni log, ni incrément), à la différence de restrict et shutdown.",3],
 ],
};

const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const maskFromCidr=c=>{let m=[0,0,0,0];for(let i=0;i<c;i++)m[i/8|0]+=(128>>(i%8));return m.join('.');};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
function opt4(correct,pool){let s=new Set([correct]);shuffle(pool);for(const p of pool){if(s.size>=4)break;s.add(p);}let arr=shuffle([...s]);return{options:arr,correct:arr.indexOf(correct)};}
const i2a=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
const a2i=s=>{const p=s.split('.');return(((+p[0]<<24)>>>0)+(+p[1]<<16)+(+p[2]<<8)+ +p[3])>>>0;};
const maskInt=c=>c===0?0:(0xFFFFFFFF<<(32-c))>>>0;
const randIp=()=>ri(1,223)+'.'+ri(0,255)+'.'+ri(0,255)+'.'+ri(1,254);
const Q=(t,text,options,correct,expl,diff)=>({topic:t,text,options,correct,expl,diff:diff||2});
const pickN=(arr,n,excl)=>{const s=new Set();let g=0;while(s.size<n&&g++<n*40){const v=arr[ri(0,arr.length-1)];if(v!==excl)s.add(v);}return[...s];};
const wild=c=>maskFromCidr(c).split('.').map(x=>255-x).join('.');

// ---- ADRESSAGE IP ----
function genIp(){
 const k=ri(0,9);
 if(k===0){const c=ri(8,30);const h=Math.pow(2,32-c)-2;const r=opt4(h,[Math.pow(2,32-c),h+2,Math.round(h/2),Math.pow(2,32-(c-1))-2,Math.pow(2,32-(c+1))-2].map(x=>Math.max(0,Math.round(x))));return Q('ip',`Combien d'hôtes utilisables dans un /${c} ?`,r.options.map(x=>x.toLocaleString('fr')),r.correct,`2^(32-${c}) - 2 = ${h.toLocaleString('fr')}.`,3);}
 if(k===1){const c=ri(8,30);const m=maskFromCidr(c);const r=opt4(m,[maskFromCidr(c-1),maskFromCidr(c+1),maskFromCidr(c-2),maskFromCidr(c+2)]);return Q('ip',`Quel masque correspond à un /${c} ?`,r.options,r.correct,`/${c} = ${m}.`,2);}
 if(k===2){const c=ri(8,30);const m=maskFromCidr(c);const r=opt4('/'+c,['/'+(c-1),'/'+(c+1),'/'+(c-3),'/'+(c+2)]);return Q('ip',`À quelle notation CIDR correspond ${m} ?`,r.options,r.correct,`${m} = /${c}.`,2);}
 if(k===3){const c=ri(8,30);const w=wild(c);const r=opt4(w,[maskFromCidr(c),wild(c-1),wild(c+1)]);return Q('ip',`Quel wildcard correspond à un /${c} ?`,r.options,r.correct,`Inverse de /${c} : ${w}.`,3);}
 if(k===4){const c=ri(16,30);const ip=randIp();const mi=maskInt(c);const net=(a2i(ip)&mi)>>>0;const r=opt4(i2a(net),[ip,i2a((net+256)>>>0),i2a((net|(~mi>>>0))>>>0),i2a((net-256)>>>0)]);return Q('ip',`Quelle est l'adresse réseau de ${ip}/${c} ?`,r.options,r.correct,`${ip} & ${maskFromCidr(c)} = ${i2a(net)}.`,3);}
 if(k===5){const c=ri(16,30);const ip=randIp();const mi=maskInt(c);const net=(a2i(ip)&mi)>>>0;const bc=(net|(~mi>>>0))>>>0;const r=opt4(i2a(bc),[i2a(net),ip,i2a((bc+1)>>>0),i2a((bc-1)>>>0)]);return Q('ip',`Quelle est l'adresse de broadcast de ${ip}/${c} ?`,r.options,r.correct,`Broadcast de ${ip}/${c} = ${i2a(bc)}.`,3);}
 if(k===6){const c=ri(16,29);const ip=randIp();const mi=maskInt(c);const net=(a2i(ip)&mi)>>>0;const f=(net+1)>>>0;const r=opt4(i2a(f),[i2a(net),i2a((net+2)>>>0),ip,i2a((net|(~mi>>>0))>>>0)]);return Q('ip',`Première adresse utilisable du réseau de ${ip}/${c} ?`,r.options,r.correct,`Réseau ${i2a(net)} → 1ère utilisable ${i2a(f)}.`,3);}
 if(k===7){const c=ri(16,29);const ip=randIp();const mi=maskInt(c);const net=(a2i(ip)&mi)>>>0;const bc=(net|(~mi>>>0))>>>0;const l=(bc-1)>>>0;const r=opt4(i2a(l),[i2a(bc),i2a((net+1)>>>0),ip,i2a(net)]);return Q('ip',`Dernière adresse utilisable du réseau de ${ip}/${c} ?`,r.options,r.correct,`Broadcast ${i2a(bc)} → dernière utilisable ${i2a(l)}.`,3);}
 if(k===8){const o1=[ri(1,126),ri(128,191),ri(192,223)][ri(0,2)];const ip=o1+'.'+ri(0,255)+'.'+ri(0,255)+'.'+ri(1,254);const cls=o1<=126?'A':o1<=191?'B':'C';const r=opt4('Classe '+cls,['Classe A','Classe B','Classe C','Classe D'].filter(x=>x!=='Classe '+cls));return Q('ip',`À quelle classe appartient ${ip} ?`,r.options,r.correct,`1er octet ${o1} → classe ${cls}.`,1);}
 let ip,priv;if(ri(0,1)===0){const b=[[10,ri(0,255)],[172,ri(16,31)],[192,168]][ri(0,2)];ip=b[0]+'.'+b[1]+'.'+ri(0,255)+'.'+ri(1,254);priv=true;}else{const o1=[ri(1,9),ri(11,126),ri(128,171),ri(193,223)][ri(0,3)];ip=o1+'.'+ri(0,255)+'.'+ri(0,255)+'.'+ri(1,254);priv=false;}
 const r=opt4(priv?'Privée':'Publique',['Privée','Publique']);return Q('ip',`L'adresse ${ip} est-elle privée ou publique ?`,r.options,r.correct,priv?'Dans une plage RFC 1918 → privée.':'Hors RFC 1918 → publique.',2);
}

// ---- VLAN ----
function genVlan(){
 const k=ri(0,3);
 if(k===0){const id=ri(0,4096);let a;if(id===0||id===4095)a='Réservé';else if(id<=1005)a='Plage normale (1-1005)';else if(id<=4094)a='Plage étendue (1006-4094)';else a='Invalide';const r=opt4(a,['Plage normale (1-1005)','Plage étendue (1006-4094)','Réservé','Invalide']);return Q('vlan',`Le VLAN ID ${id} appartient à quelle catégorie ?`,r.options,r.correct,`${id} → ${a}.`,2);}
 if(k===1){const n=ri(2,4094);const c=`switchport access vlan ${n}`;const r=opt4(c,[`switchport mode vlan ${n}`,`vlan ${n} access`,`switchport trunk vlan ${n}`,`set vlan ${n}`]);return Q('vlan',`Quelle commande affecte un port d'accès au VLAN ${n} ?`,r.options,r.correct,`switchport access vlan ${n} (en mode access).`,2);}
 if(k===2){const n=ri(2,4094);const c=`encapsulation dot1q ${n}`;const r=opt4(c,[`encapsulation isl ${n}`,`switchport access vlan ${n}`,`dot1q vlan ${n}`,`vlan ${n} encapsulation`]);return Q('vlan',`Sur une sous-interface (router-on-a-stick), quelle commande associe le VLAN ${n} ?`,r.options,r.correct,`encapsulation dot1q ${n}.`,3);}
 const n=ri(2,4094);const c=`switchport trunk allowed vlan ${n}`;const r=opt4(c,[`switchport access vlan ${n}`,`switchport trunk vlan ${n}`,`vlan allowed ${n}`,`trunk allowed ${n}`]);return Q('vlan',`Quelle commande autorise uniquement le VLAN ${n} sur un trunk ?`,r.options,r.correct,`switchport trunk allowed vlan ${n}.`,2);
}

// ---- ROUTAGE ----
const AD={'un réseau connecté':0,'une route statique':1,'eBGP':20,'EIGRP':90,'OSPF':110,'IS-IS':115,'RIP':120,'EIGRP externe':170,'iBGP':200};
const BW=[['56 kbps',56000],['64 kbps',64000],['128 kbps',128000],['256 kbps',256000],['512 kbps',512000],['768 kbps',768000],['T1 (1,544 Mbps)',1544000],['E1 (2,048 Mbps)',2048000],['2 Mbps',2e6],['4 Mbps',4e6],['8 Mbps',8e6],['10 Mbps',1e7],['16 Mbps',16e6],['25 Mbps',25e6],['34 Mbps',34e6],['45 Mbps',45e6],['50 Mbps',5e7],['100 Mbps',1e8],['155 Mbps',155e6],['200 Mbps',2e8],['622 Mbps',622e6],['1 Gbps',1e9],['2,5 Gbps',25e8],['10 Gbps',1e10],['40 Gbps',4e10],['100 Gbps',1e11]];
function genRoutage(){
 const k=ri(0,6);
 if(k===0){const ns=Object.keys(AD);const p=ns[ri(0,ns.length-1)];const v=AD[p];const r=opt4(String(v),[0,1,20,90,110,115,120,170,200].filter(x=>x!==v).map(String));return Q('routage',`Quelle est la distance administrative par défaut de ${p} ?`,r.options,r.correct,`AD de ${p} = ${v}.`,2);}
 if(k===1){const ns=Object.keys(AD);const p=ns[ri(0,ns.length-1)];const v=AD[p];const r=opt4(p,pickN(ns.filter(x=>x!==p),3));return Q('routage',`Quel élément a une distance administrative de ${v} ?`,r.options,r.correct,`AD ${v} → ${p}.`,2);}
 if(k===2){const refs=[['',1e8],[' (référence 1 Gbps)',1e9],[' (référence 10 Gbps)',1e10]];const rf=refs[ri(0,refs.length-1)];const b=BW[ri(0,BW.length-1)];const cost=Math.max(1,Math.round(rf[1]/b[1]));const r=opt4(String(cost),[Math.max(1,Math.round(cost/2)),Math.max(2,cost*2),cost+1,Math.max(1,Math.round(1e8/b[1]))].map(String));return Q('routage',`Coût OSPF d'un lien à ${b[0]}${rf[0]} ?`,r.options,r.correct,`Coût = référence / bande passante = ${cost}.`,3);}
 if(k===3){const h=ri(0,20);const ok=h<=15;const r=opt4(ok?'Accessible':'Inaccessible',['Accessible','Inaccessible']);return Q('routage',`En RIP, un réseau situé à ${h} sauts est-il accessible ?`,r.options,r.correct,ok?`${h} ≤ 15 → accessible.`:`${h} > 15 (max RIP) → inaccessible.`,2);}
 if(k===4){const c=ri(8,30);const w=wild(c);const r=opt4(w,[maskFromCidr(c),wild(c-1),wild(c+1)]);return Q('routage',`Quel wildcard utiliser dans la commande "network" pour annoncer un /${c} en OSPF ?`,r.options,r.correct,`Wildcard de /${c} = ${w}.`,3);}
 if(k===5){const a=Object.keys(AD);let i=ri(0,a.length-1),j=ri(0,a.length-1);while(j===i)j=ri(0,a.length-1);const win=AD[a[i]]<AD[a[j]]?a[i]:a[j];const r=opt4(win,[win===a[i]?a[j]:a[i]]);return Q('routage',`Entre ${a[i]} et ${a[j]}, quelle route est préférée (AD la plus faible) ?`,r.options,r.correct,`AD ${a[i]}=${AD[a[i]]}, ${a[j]}=${AD[a[j]]} → ${win}.`,2);}
 const M={'OSPF':'le coût (bande passante)','RIP':'le nombre de sauts','EIGRP':'la bande passante et le délai','BGP':'des attributs de chemin','IS-IS':'le coût'};const ks=Object.keys(M);const p=ks[ri(0,ks.length-1)];const r=opt4(M[p],pickN(Object.values(M).filter(x=>x!==M[p]),3));return Q('routage',`Sur quoi repose la métrique de ${p} ?`,r.options,r.correct,`${p} utilise ${M[p]}.`,1);
}

// ---- ACL ----
function genAcl(){
 const k=ri(0,4);
 if(k===0){const n=ri(1,2699);let a;if((n<=99)||(n>=1300&&n<=1999))a='ACL standard';else if((n>=100&&n<=199)||(n>=2000&&n<=2699))a='ACL étendue';else a='Hors plage ACL IP';const r=opt4(a,['ACL standard','ACL étendue','Hors plage ACL IP']);return Q('acl',`À quel type correspond une ACL numérotée ${n} ?`,r.options,r.correct,`${n} → ${a}.`,2);}
 if(k===1){const c=ri(8,30);const w=wild(c);const r=opt4(w,[maskFromCidr(c),wild(c-1),wild(c+1)]);return Q('acl',`Quel wildcard couvre exactement un /${c} dans une ACL ?`,r.options,r.correct,`/${c} → ${w}.`,3);}
 if(k===2){const c=ri(8,30);const m=maskFromCidr(c);const w=wild(c);const r=opt4(m,[w,maskFromCidr(ri(8,30)),'0.0.0.0']);return Q('acl',`À quel masque réseau correspond le wildcard ${w} ?`,r.options,r.correct,`Inverse de ${w} = ${m}.`,3);}
 if(k===3){const c=ri(8,30);const w=wild(c);const r=opt4('/'+c,['/'+(c-1),'/'+(c+1),'/'+(c+2)]);return Q('acl',`Le wildcard ${w} correspond à quel préfixe CIDR ?`,r.options,r.correct,`${w} → /${c}.`,3);}
 const ip=randIp();const r=opt4('0.0.0.0',['255.255.255.255','0.0.0.255','255.0.0.0']);return Q('acl',`Quel wildcard cible l'hôte unique ${ip} (mot-clé host) ?`,r.options,r.correct,`host ${ip} = wildcard 0.0.0.0.`,3);
}

// ---- MODÈLE OSI ----
const L={1:'Physique',2:'Liaison',3:'Réseau',4:'Transport',5:'Session',6:'Présentation',7:'Application'};
const PROTO={'HTTP':7,'HTTPS':7,'HTTP/2':7,'HTTP/3':7,'WebSocket':7,'FTP':7,'FTPS':7,'SFTP':7,'TFTP':7,'SCP':7,'SMTP':7,'SMTPS':7,'POP3':7,'POP3S':7,'IMAP':7,'IMAPS':7,'DNS':7,'DoH':7,'DoT':7,'DHCP':7,'DHCPv6':7,'SNMP':7,'Telnet':7,'SSH':7,'LDAP':7,'LDAPS':7,'NTP':7,'SIP':7,'RTSP':7,'RDP':7,'VNC':7,'Kerberos':7,'RADIUS':7,'TACACS+':7,'Diameter':7,'Syslog':7,'SMB':7,'NFS':7,'AFP':7,'IRC':7,'XMPP':7,'NETCONF':7,'RESTCONF':7,'SSDP':7,'mDNS':7,'NNTP':7,'Gopher':7,'Finger':7,'WHOIS':7,'MQTT':7,'AMQP':7,'CoAP':7,'gRPC':7,'SOAP':7,'STUN':7,'TURN':7,'MGCP':7,'H.323':7,'Megaco':7,'Memcached':7,'Redis':7,'MySQL':7,'PostgreSQL':7,'MongoDB':7,'JPEG':6,'GIF':6,'PNG':6,'BMP':6,'TIFF':6,'MPEG':6,'MP3':6,'MIDI':6,'ASCII':6,'Unicode':6,'UTF-8':6,'EBCDIC':6,'MIME':6,'NetBIOS':5,'RPC':5,'SOCKS':5,'TCP':4,'UDP':4,'SCTP':4,'DCCP':4,'IP':3,'IPv4':3,'IPv6':3,'ICMP':3,'ICMPv6':3,'IGMP':3,'OSPF':3,'EIGRP':3,'IPsec':3,'AH':3,'ESP':3,'GRE':3,'NAT':3,'VRRP':3,'HSRP':3,'PIM':3,'Ethernet':2,'PPP':2,'HDLC':2,'Frame Relay':2,'ARP':2,'STP':2,'RSTP':2,'802.1Q':2,'LACP':2,'CDP':2,'LLDP':2,'802.11':2,'VTP':2,'DTP':2,'RJ45':1,'fibre optique':1,'câble coaxial':1,'paire torsadée':1,'hub':1,'répéteur':1,'connecteur':1,'signal électrique':1};
const PORTS={20:'FTP (données)',21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',67:'DHCP',69:'TFTP',80:'HTTP',110:'POP3',119:'NNTP',123:'NTP',143:'IMAP',161:'SNMP',179:'BGP',389:'LDAP',443:'HTTPS',445:'SMB',514:'Syslog',520:'RIP',587:'SMTP (soumission)',636:'LDAPS',989:'FTPS',993:'IMAPS',995:'POP3S',1812:'RADIUS',3306:'MySQL',3389:'RDP',5060:'SIP',8080:'HTTP (alt)'};
const ROLE=[["le routage et l'adressage logique (IP)",3],["la commutation par adresse MAC",2],["le transport fiable et la segmentation",4],["le chiffrement, la compression et le format des données",6],["l'établissement et la gestion des sessions",5],["la transmission des bits et le signal physique",1],["l'interface avec les applications de l'utilisateur",7],["le contrôle de flux et le fenêtrage",4],["l'adressage physique (MAC)",2],["la détection d'erreurs de la trame (FCS)",2],["le multiplexage par numéro de port",4],["la représentation et l'encodage des données",6],["la synchronisation et les points de reprise du dialogue",5]];
const EQUIP=[["un routeur",3],["un commutateur (switch)",2],["un pont (bridge)",2],["un concentrateur (hub)",1],["un répéteur",1],["un modem",1],["une carte réseau (NIC)",2],["un point d'accès Wi-Fi",2]];
function layerOpt(correct){const s=new Set([correct]);while(s.size<4)s.add(ri(1,7));const arr=shuffle([...s]);return{options:arr.map(n=>'Couche '+n+' ('+L[n]+')'),correct:arr.indexOf(correct)};}
function genOsi(){
 const PDU={1:'un bit',2:'une trame',3:'un paquet',4:'un segment'};
 const k=ri(0,9);
 if(k===0){const ns=Object.keys(PROTO);const p=ns[ri(0,ns.length-1)];const r=layerOpt(PROTO[p]);return Q('osi',`À quelle couche OSI se situe ${p} ?`,r.options,r.correct,`${p} → couche ${PROTO[p]} (${L[PROTO[p]]}).`,2);}
 if(k===1){const ps=Object.keys(PORTS);const p=ps[ri(0,ps.length-1)];const sv=PORTS[p];const r=opt4(sv,pickN(Object.values(PORTS).filter(x=>x!==sv),3));return Q('osi',`Quel service utilise le port ${p} ?`,r.options,r.correct,`Port ${p} → ${sv}.`,3);}
 if(k===2){const n=ri(1,4);const r=opt4(PDU[n],[PDU[1],PDU[2],PDU[3],PDU[4]].filter(x=>x!==PDU[n]));return Q('osi',`Quelle est l'unité de données (PDU) de la couche ${n} (${L[n]}) ?`,r.options,r.correct,`Couche ${n} → ${PDU[n]}.`,2);}
 if(k===3){const n=ri(1,4);const r=layerOpt(n);const w=PDU[n].charAt(0).toUpperCase()+PDU[n].slice(1);return Q('osi',`${w} est la PDU de quelle couche ?`,r.options,r.correct,`${PDU[n]} → couche ${n}.`,2);}
 if(k===4){const n=ri(1,7);const r=opt4(L[n],Object.values(L).filter(x=>x!==L[n]));return Q('osi',`Quel est le nom de la couche ${n} ?`,r.options,r.correct,`Couche ${n} = ${L[n]}.`,1);}
 if(k===5){const n=ri(1,7);const r=opt4(String(n),[1,2,3,4,5,6,7].filter(x=>x!==n).map(String));return Q('osi',`Quel est le numéro de la couche ${L[n]} ?`,r.options,r.correct,`${L[n]} = couche ${n}.`,1);}
 if(k===6){const n=ri(1,6);const r=opt4(L[n+1],Object.values(L).filter(x=>x!==L[n+1]));return Q('osi',`Quelle couche se trouve juste au-dessus de la couche ${L[n]} ?`,r.options,r.correct,`Au-dessus de ${L[n]} → ${L[n+1]}.`,2);}
 if(k===7){const n=ri(2,7);const r=opt4(L[n-1],Object.values(L).filter(x=>x!==L[n-1]));return Q('osi',`Quelle couche se trouve juste en dessous de la couche ${L[n]} ?`,r.options,r.correct,`En dessous de ${L[n]} → ${L[n-1]}.`,2);}
 if(k===8){const rl=ROLE[ri(0,ROLE.length-1)];const r=layerOpt(rl[1]);return Q('osi',`Quelle couche assure ${rl[0]} ?`,r.options,r.correct,`→ couche ${rl[1]} (${L[rl[1]]}).`,2);}
 const eq=EQUIP[ri(0,EQUIP.length-1)];const r=layerOpt(eq[1]);return Q('osi',`À quelle couche opère ${eq[0]} ?`,r.options,r.correct,`${eq[0]} → couche ${eq[1]} (${L[eq[1]]}).`,1);
}

const GEN={vlan:genVlan,routage:genRoutage,ip:genIp,osi:genOsi,acl:genAcl};
const DIFFS={facile:1,moyen:2,difficile:3,expert:4};
// Niveau (1=facile, 2=moyen, 3=difficile) de chaque question rédigée de BANK, dans l'ordre.
const SDIFF={
 vlan:    [1,1,3,2,2,2,2,1,2,3,2,1,2,1,1,2,3,2],
 routage: [1,2,2,2,1,3,1,2,2,2,3,3,2,2,1,3,2,1],
 ip:      [1,2,3,2,2,2,2,2,3,1,1,2,3,3,3,1,1,2],
 osi:     [1,1,1,1,2,2,1,1,2,2,2,1,2,3,1,2,2,2],
 acl:     [2,2,2,2,3,3,3,3,1,2,3,3,3,2,3,2,2,3],
};
function staticsOf(topic){
 // Mélange l'ordre des réponses pour ne pas figer la position de la bonne réponse.
 const mk=(k,text,opts,correct,expl,diff)=>{const o=opts.slice();const cv=o[correct];shuffle(o);return{topic:k,text,options:o,correct:o.indexOf(cv),expl,diff};};
 const map=k=>BANK[k][1].map((q,i)=>mk(k,q[0],q[1],q[2],q[3],(SDIFF[k]&&SDIFF[k][i])||2));
 const hard=k=>(HARD[k]||[]).map(q=>mk(k,q[0],q[1],q[2],q[3],3));
 const more=k=>(MORE[k]||[]).map(q=>mk(k,q[0],q[1],q[2],q[3],q[4]||2));
 const expert=k=>(EXPERT[k]||[]).map(q=>mk(k,q[0],q[1],q[2],q[3],4));
 if(topic==='all'){let o=[];for(const k in BANK)o=o.concat(map(k),hard(k),more(k),expert(k));return o;}
 return BANK[topic]?map(topic).concat(hard(topic),more(topic),expert(topic)):[];
}
function genOf(topic){
 if(topic==='all'){const ks=Object.keys(GEN);return GEN[ks[ri(0,ks.length-1)]]();}
 return GEN[topic]?GEN[topic]():genIp();
}
let recentQ=new Set(); // questions du questionnaire précédent, pour ne pas les retirer au suivant
function buildQuestions(topic,count,diff){
 const d=DIFFS[diff]||0; // 0 = tous niveaux
 const okd=q=>!d||q.diff===d;
 const themes=topic==='all'?Object.keys(BANK):[topic]; // round-robin pour couvrir tous les thèmes
 const m=new Map();
 // 1) Round-robin des questions rédigées entre thèmes (variété + on évite les récentes).
 const stat={},pos={};
 for(const t of themes){stat[t]=shuffle(staticsOf(t).filter(q=>okd(q)&&!recentQ.has(q.text)));pos[t]=0;}
 let progress=true;
 while(m.size<count&&progress){progress=false;
  for(const t of themes){if(m.size>=count)break;
   while(pos[t]<stat[t].length){const q=stat[t][pos[t]++];if(!m.has(q.text)){m.set(q.text,q);progress=true;break;}}}}
 // 2) Round-robin des questions générées (mêmes thèmes, même niveau, non récentes).
 let g=0;
 while(m.size<count&&g++<count*200){for(const t of themes){if(m.size>=count)break;
   const q=genOf(t);if(q&&okd(q)&&!m.has(q.text)&&!recentQ.has(q.text))m.set(q.text,q);}}
 // 3) Filet de sécurité : on réautorise les récentes, puis on complète tous niveaux confondus.
 if(m.size<count)for(const t of themes)shuffle(staticsOf(t).filter(okd)).forEach(q=>{if(m.size<count&&!m.has(q.text))m.set(q.text,q);});
 if(m.size<count)for(const t of themes)shuffle(staticsOf(t)).forEach(q=>{if(m.size<count&&!m.has(q.text))m.set(q.text,q);});
 let g2=0;while(m.size<count&&g2++<count*200){const t=themes[g2%themes.length];const q=genOf(t);if(q&&!m.has(q.text))m.set(q.text,q);}
 const out=shuffle([...m.values()]).slice(0,count);
 recentQ=new Set(out.map(q=>q.text)); // mémorise pour le prochain questionnaire
 return out;
}

const page=fs.readFileSync(path.join(__dirname,'play.html'));
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(page);});
const wss=new WebSocketServer({server});

const players=new Map();
let game=null,nextId=1,hostId=null;

const send=(ws,o)=>{if(ws.readyState===1)ws.send(JSON.stringify(o));};
const broadcast=o=>{for(const ws of players.keys())send(ws,o);};
// L'hôte est un joueur désigné (hostId). hostWs() le retrouve s'il est toujours connecté.
const hostWs=()=>{for(const[ws,p]of players)if(p.id===hostId&&ws.readyState===1)return ws;return null;};
const answered=()=>[...players.values()].filter(p=>p.answered).length;
const board=()=>[...players.values()].sort((a,b)=>b.score-a.score).map(p=>({name:p.name,avatar:p.avatar||'',title:p.title||'',score:p.score,gain:p.gain||0,streak:p.streak}));

function pushLobby(){const h=hostWs();for(const[ws,p]of players)send(ws,{t:'lobby',host:ws===h,hasHost:!!h,inGame:!!game,players:[...players.values()].map(x=>({name:x.name,avatar:x.avatar||'',title:x.title||''}))});}

const DIFFLABEL={1:'Facile',2:'Moyen',3:'Difficile',4:'Expert'};
function startGame(topic,count,diff){
  const qs=buildQuestions(topic,count,diff);
  game={qs,idx:-1,topic,diff};
  for(const p of players.values()){p.score=0;p.streak=0;}
  nextQuestion();
}
function nextQuestion(){
  if(!game)return;
  game.idx++;
  if(game.idx>=game.qs.length)return endGame();
  const q=game.qs[game.idx];
  game.qStart=Date.now();game.revealed=false;
  for(const p of players.values()){p.answered=false;p.ai=-1;p.at=0;p.gain=0;}
  broadcast({t:'question',n:game.idx+1,total:game.qs.length,topic:BANK[q.topic][0],diff:DIFFLABEL[q.diff]||'',q:q.text,options:q.options,duration:DUR});
  game.timer=setTimeout(reveal,DUR*1000);
}
function reveal(){
  if(!game||game.revealed)return;
  game.revealed=true;clearTimeout(game.timer);
  const q=game.qs[game.idx];
  for(const p of players.values()){
    let gain=0,ok=false;
    if(p.answered&&p.ai===q.correct){ok=true;const tt=Math.min(p.at/1000,DUR);gain=500+Math.round(500*(1-tt/DUR));p.streak++;gain+=Math.min((p.streak-1)*50,300);}
    else p.streak=0;
    p.gain=gain;p.score+=gain;p.lastOk=ok;
  }
  const h=hostWs();
  // Ce que chaque joueur a répondu (pour l'affichage au reveal).
  const picks=[...players.values()].map(p=>{const a=(p.answered&&p.ai>=0)?p.ai:-1;return{name:p.name,avatar:p.avatar||'',ai:a,text:a>=0?q.options[a]:'',ok:a===q.correct};});
  // Pas d'enchaînement automatique : c'est l'hôte qui déclenche la question suivante (message 'next').
  for(const[ws,p]of players)send(ws,{t:'reveal',correct:q.correct,correctText:q.options[q.correct],expl:q.expl,you:{ok:p.lastOk,gain:p.gain},picks,board:board(),n:game.idx+1,total:game.qs.length,host:ws===h});
}
function endGame(){const h=hostWs();const b=board();for(const[ws,p]of players)send(ws,{t:'gameover',board:b,host:ws===h});game=null;}

const isLoopback=a=>!!a&&(a==='::1'||a==='127.0.0.1'||a.startsWith('::ffff:127.')||a.startsWith('127.'));
wss.on('connection',(ws,req)=>{
  // L'hôte = la machine qui héberge (connexion en loopback, ex. http://localhost) ou ?host=1.
  ws._hostEligible=isLoopback(req.socket.remoteAddress)||/[?&]host=1\b/.test(req.url||'');
  ws.on('message',d=>{
    let m;try{m=JSON.parse(d);}catch(e){return;}
    if(m.t==='join'){
      if(players.has(ws))return; // déjà dans le lobby
      const host=hostWs();
      // On ne peut rejoindre que si un hôte est présent — sauf si on est soi-même l'hôte éligible (premier arrivé).
      if(!host&&!ws._hostEligible){send(ws,{t:'nohost'});return;}
      const id=nextId++;
      players.set(ws,{id,name:(m.name||'Joueur').toString().slice(0,16)||'Joueur',avatar:(m.avatar||'').toString().slice(0,8),title:(m.title||'').toString().slice(0,24),score:0,streak:0,answered:false,ai:-1,at:0,gain:0});
      if(hostId===null&&ws._hostEligible)hostId=id; // désigne l'hôte
      pushLobby();
    }else if(m.t==='avatar'){
      const p=players.get(ws);
      if(p){p.avatar=(m.avatar||'').toString().slice(0,8);pushLobby();}
    }else if(m.t==='title'){
      const p=players.get(ws);
      if(p){p.title=(m.title||'').toString().slice(0,24);pushLobby();}
    }else if(m.t==='start'){
      if(ws===hostWs()&&!game){const c=[5,10,15].includes(m.count)?m.count:10;const d=DIFFS[m.diff]?m.diff:'all';startGame(m.topic||'all',c,d);}
    }else if(m.t==='next'){
      // Seul l'hôte fait passer à la question suivante après le reveal.
      if(ws===hostWs()&&game&&game.revealed)nextQuestion();
    }else if(m.t==='menu'){
      // L'hôte ramène toute la salle au menu (lobby), en stoppant la partie en cours.
      if(ws===hostWs()){if(game){clearTimeout(game.timer);game=null;}broadcast({t:'tomenu'});pushLobby();}
    }else if(m.t==='answer'){
      const p=players.get(ws);
      if(p&&game&&!game.revealed&&!p.answered){
        p.answered=true;p.ai=m.i;p.at=Date.now()-game.qStart;
        broadcast({t:'progress',answered:answered(),total:players.size});
        if([...players.values()].every(x=>x.answered))reveal();
      }
    }
  });
  ws.on('close',()=>{
    const p=players.get(ws);
    players.delete(ws);
    // Si l'hôte part : on arrête la partie et le lobby attend qu'un hôte revienne.
    if(p&&p.id===hostId){hostId=null;if(game){clearTimeout(game.timer);game=null;}}
    if(players.size===0){if(game)clearTimeout(game.timer);game=null;hostId=null;}
    pushLobby();
  });
});

function lanIp(){const ifs=os.networkInterfaces();for(const k in ifs)for(const a of ifs[k])if(a.family==='IPv4'&&!a.internal)return a.address;return 'localhost';}

if(process.argv[2]==='count'){
  for(const t of ['vlan','routage','ip','osi','acl']){
    const s=new Set();for(let i=0;i<80000;i++)s.add(GEN[t]().text);
    const stat=BANK[t][1].length;
    console.log('  '+t.padEnd(8)+' : ~'+String(s.size).padStart(5)+' générées  + '+stat+' rédigées');
  }
  process.exit(0);
}
server.listen(PORT,'0.0.0.0',()=>{
  console.log('\n  ┌─ Quiz Réseau · multijoueur ─────────────────');
  console.log('  │  Toi          : http://localhost:'+PORT);
  console.log('  │  Tes potes    : http://'+lanIp()+':'+PORT+'  (même WiFi)');
  console.log('  │  Stop         : Ctrl + C');
  console.log('  └─────────────────────────────────────────────\n');
});

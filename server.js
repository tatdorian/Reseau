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
const DIFFS={facile:1,moyen:2,difficile:3};
// Niveau (1=facile, 2=moyen, 3=difficile) de chaque question rédigée de BANK, dans l'ordre.
const SDIFF={
 vlan:    [1,1,3,2,2,2,2,1,2,3,2,1,2,1,1,2,3,2],
 routage: [1,2,2,2,1,3,1,2,2,2,3,3,2,2,1,3,2,1],
 ip:      [1,2,3,2,2,2,2,2,3,1,1,2,3,3,3,1,1,2],
 osi:     [1,1,1,1,2,2,1,1,2,2,2,1,2,3,1,2,2,2],
 acl:     [2,2,2,2,3,3,3,3,1,2,3,3,3,2,3,2,2,3],
};
function staticsOf(topic){
 const map=k=>BANK[k][1].map((q,i)=>({topic:k,text:q[0],options:q[1],correct:q[2],expl:q[3],diff:(SDIFF[k]&&SDIFF[k][i])||2}));
 if(topic==='all'){let o=[];for(const k in BANK)o=o.concat(map(k));return o;}
 return BANK[topic]?map(topic):[];
}
function genOf(topic){
 if(topic==='all'){const ks=Object.keys(GEN);return GEN[ks[ri(0,ks.length-1)]]();}
 return GEN[topic]?GEN[topic]():genIp();
}
function buildQuestions(topic,count,diff){
 const d=DIFFS[diff]||0; // 0 = tous niveaux
 const okd=q=>!d||q.diff===d;
 const m=new Map();
 const add=q=>{if(q&&okd(q)&&!m.has(q.text))m.set(q.text,q);};
 shuffle(staticsOf(topic).filter(okd)).slice(0,Math.ceil(count/2)).forEach(add);
 let g=0;while(m.size<count&&g++<count*200)add(genOf(topic));
 if(m.size<count)shuffle(staticsOf(topic).filter(okd)).forEach(add);
 // Filet de sécurité : si le pool d'un niveau est trop petit, on complète avec les autres niveaux.
 if(m.size<count){
  shuffle(staticsOf(topic)).forEach(q=>{if(m.size<count&&!m.has(q.text))m.set(q.text,q);});
  let g2=0;while(m.size<count&&g2++<count*200){const q=genOf(topic);if(q&&!m.has(q.text))m.set(q.text,q);}
 }
 return shuffle([...m.values()]).slice(0,count);
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
const board=()=>[...players.values()].sort((a,b)=>b.score-a.score).map(p=>({name:p.name,score:p.score,gain:p.gain||0,streak:p.streak}));

function pushLobby(){const h=hostWs();for(const[ws,p]of players)send(ws,{t:'lobby',host:ws===h,hasHost:!!h,inGame:!!game,players:[...players.values()].map(x=>({name:x.name}))});}

const DIFFLABEL={1:'Facile',2:'Moyen',3:'Difficile'};
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
  // Pas d'enchaînement automatique : c'est l'hôte qui déclenche la question suivante (message 'next').
  for(const[ws,p]of players)send(ws,{t:'reveal',correct:q.correct,correctText:q.options[q.correct],expl:q.expl,you:{ok:p.lastOk,gain:p.gain},board:board(),n:game.idx+1,total:game.qs.length,host:ws===h});
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
      players.set(ws,{id,name:(m.name||'Joueur').toString().slice(0,16)||'Joueur',score:0,streak:0,answered:false,ai:-1,at:0,gain:0});
      if(hostId===null&&ws._hostEligible)hostId=id; // désigne l'hôte
      pushLobby();
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

# Kontrola požiadaviek

Funkcie používajú API a MariaDB; kanály, členstvá, pozvánky, bany, hlasy a správy
už nie sú iba údaje v pamäti prehliadača.

| Požiadavka | Implementácia |
| --- | --- |
| Registrácia, prihlásenie, odhlásenie | Registrácia uloží používateľa a hash hesla. Prihlásenie overí nick/email a heslo. Odhlásenie zruší aktuálny prístupový token na serveri. |
| Meno, priezvisko, nickName, email | Povinné polia registrácie a profil používateľa. Nick a email majú unikátne databázové obmedzenia. |
| Zoznam vlastných kanálov | API vracia iba kanály, ktorých je používateľ členom. Odchod, odobratie a ban sa prejavia aj u ostatných klientov. |
| Zvýraznenie a topovanie pozvánky | Pozvanie je čakajúca pozvánka iba v Inboxe. Až po Accept sa kanál zobrazí v zozname (pripnutý), používateľ medzi členmi a sprístupní sa história aj odosielanie správ. Otvorenie Inboxu pozvánku neprijme. |
| Vytvorenie, opustenie a zrušenie cez UI | Tlačidlo + a menu pri kanáli. Zrušenie vyžaduje správcu a potvrdenie. |
| Public/private; tvorca je správca | Typ aj správca sa ukladajú v databáze. Kontrola oprávnení prebieha aj na serveri. |
| Zánik po viac než 30 dňoch bez správy | Kontrola pred každým čítaním/zápisom a každú minútu počas behu backendu. Nový kanál počíta neaktivitu od vytvorenia. Zánik uvoľní názov. |
| Fixný vstup správ a príkazov | Composer zostáva dole, história má vlastný scroll. Správy môže odosielať iba člen kanála. |
| `/join channelName [private]` | Vytvorí neexistujúci kanál alebo pripojí k verejnému. Súkromný kanál vyžaduje pozvanie správcom. |
| `/invite nickName` | V súkromnom kanáli iba správca, vo verejnom ľubovoľný člen. Ban môže zrušiť iba správca. |
| `/revoke nickName` | Iba správca súkromného kanála môže odobrať člena. |
| `/kick nickName` | Iba verejný kanál: tri hlasy rôznych členov znamenajú ban; správca banuje okamžite. Duplicitný hlas sa odmietne. Správcu nemožno vyhodiť. |
| Unikátne nickName a channelName | Validácia aj databázové unikátne indexy; súkromné a verejné kanály zdieľajú priestor názvov. |
| `/quit` | Správca zruší kanál vrátane správ, členstiev, banov a hlasov. |
| `/cancel` | Člen odíde; pri odchode správcu kanál zanikne. |
| `@nickname` | Server uloží ID spomenutých členov. Správa aj zmienka sú zvýraznené príslušnému používateľovi. |

## Spustenie a synchronizácia

Zapni MySQL v XAMPP a v priečinku `project` spusti `npm start`.
Po aktualizácii reštartuj tento príkaz a obnov stránku v prehliadači.
Na inom počítači treba najprv nainštalovať závislosti, nastaviť `backend/.env`
a spustiť `node ace migration:run` v priečinku `backend`.

Aktualizácie medzi klientmi sa načítavajú každé 2 sekundy (HTTP polling).
Token je uložený pre konkrétnu kartu prehliadača a prežije obnovenie stránky.
Počet neprečítaných správ sa zobrazuje pri kanáli a ukladá sa pre každého člena
v databáze. Vlastné správy sa nepočítajú. Otvorenie kanála vo viditeľnej karte
označí načítané správy ako prečítané; skrytá karta ich automaticky neoznačuje.
Na ukážku viacerých používateľov použi samostatné karty alebo prehliadače.
Zmeny zostávajú v databáze aj po reštarte servera.

## Automatické overenie

Pri spustenom lokálnom backende a MySQL, z priečinka `project`:

```powershell
npm run test:requirements
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix backend run typecheck
npm --prefix frontend run build
```

API test vytvorí šesť dočasných účtov s jedinečnými menami, overí pravidlá na
skutočnej databáze a v bloku `finally` odstráni iba svoje účty a ich dáta.
Je určený pre lokálne vývojové prostredie. Overuje aj súbežné vytvorenie kanála,
odmietnutie zlého hesla, zákaz prístupu nečlenom a zneplatnenie tokenu.

## Rýchla manuálna ukážka

1. Zaregistruj účty napr. `anna`, `boris`, `cyril`, `dana`, `eva` a prihlás ich
   v samostatných kartách. Každý účet potrebuje vlastný email.
2. Ako Anna zadaj `/join seminar`. Anna je správca. Ostatní sa pripoja rovnakým príkazom.
3. Pošli `Ahoj @boris`. V Borisovej karte sa správa zvýrazní. Obnov stránku:
   prihlásenie, členstvo a história zostanú zachované.
4. Boris, Cyril a Dana každý zadajú `/kick eva`. Tretí hlas odstráni kanál
   z Evinho zoznamu. Eva sa cez `/join seminar` nedostane späť.
5. Anna zadá `/invite eva`; Eva dostane pozvánku v Inboxe. Po Accept uvidí kanál na začiatku zoznamu.
6. Anna vytvorí `/join tajny private`. Boris sa bez pozvánky nepripojí.
   Anna zadá `/invite boris`, Boris klikne Accept v Inboxe, potom Anna zadá `/revoke boris` a overí odobratie prístupu.
7. Vyskúšaj + a menu pri kanáli. `/cancel` bežného člena odstráni iba členstvo;
   `/quit` alebo `/cancel` správcu po potvrdení odstráni celý kanál.
8. Odhlás sa tlačidlom pri profile. Priamy vstup na adresu kanála vyžaduje prihlásenie.

Databázu otvor cez http://localhost/phpmyadmin/ po zapnutí Apache v XAMPP.
V databáze podľa `DB_DATABASE` nájdeš `users`, `channels`, `channel_members`,
`channel_bans`, `channel_kick_votes`, `messages` a `auth_access_tokens`.

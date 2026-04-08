---
marp: false
---


# JUKEBOXD: MUSIC REVIEWS

## IT&C 350 DATABASE DESIGN PROJECT
### WINTER 2026

* Spencer Ord
* Robert Stone
* James Sturdevant
* Ben Davis
* Brendan Lewis

---

## TABLE OF CONTENTS

| Section | Page |
| :--- | :--- |
| Project Overview | 1 |
| Project Objective Statement | 2 |
| Project Stakeholders | 3 |
| Type chapter level (level 1) | 4 |
| Type chapter level (level 2) | 5 |
| Type chapter title (level 3) | 6 |

---

## PROJECT OVERVIEW

### PROJECT OBJECTIVE STATEMENT
Jukeboxd is a database that stores a user's reviews of musical albums and songs. Users will also be able to see other users' reviews.

### PROJECT STAKEHOLDERS
Stakeholders in Jukeboxd include music listeners and lovers, a professional team of coders, security professionals versed in database security, a marketing team, and a management team. Other stakeholders will eventually include singers, song-writers, record labels, and other musicians or staff working in the music industry. These are the primary stakeholders that would be affected by a music rating and sharing system like Jukeboxd. 

The following contains a breakdown of our stakeholders:
* Users
  * Serious music listeners
    * This group of people really cares about music. They may have a musical background or just really enjoy listening to it. 
    * They will most likely want to share thoughtful reviews with technical breakdown and their ratings will be thought-out. 
    * They will be interested in seeing similar reviews that they will engage with academically. 
    * This will probably represent the most engaged user base, but not make up the largest portion.
  * Casual music listeners
    * This group enjoys listening to music, but does not necessarily have a deep musical background. 
    * They will leave ratings, but probably only write short reviews, many of which will be humorous rather than critical. 
    * This group of people will probably make up the majority of the user base, but not be as engaged as serious listeners.
* Employees
  * A Professional Team of coders
    * There will need to be a development team that maintains the front-end and back-end of the application. 
    * They will be invested based on their employment.
  * Security professionals versed in database security
    * There will need to be a team that ensures the database is protected from attacks.
  * A marketing team
    * This team will promote the application and try to acquire sponsorships from artists, record labels, and music-sharing apps (like Spotify, Apple Music, etc.)
  * A management team
    * The management team will oversee the entire process. They will interface with the other shareholders to ensure their views are represented in the product.
* Potential Investors/Champions 
  * Singers
    * They will want to see their songs promoted on Jukeboxd. 
    * They can take feedback based on reviews, which could help them produce more popular songs.
  * Song-writers
    * Same as singers
  * Record labels
    * They will want to see artists signed to their label receiving good reviews. 
    * They could also promote their artists through the app which could generate more listenership and therefore more revenue. 
    * They could also identify artists they would like to sign based on who receives good reviews.
  * Others working in the music industry
    * Executives in the music industry would all benefit from more people listening to music and talking about popular albums and artists. 
    * If Jukeboxd is successful, it will generate more publicity and engagement with new songs and albums which will benefit everyone in the music industry, especially executives.

## APP REQUIREMENTS

### FUNCTIONAL REQUIREMENTS
* Users can look up and review songs and albums through a search bar
* Users can see the reviews other people have made and comment on them in a feed by searching
* Users can add friends by clicking on their profile that is displayed in their reviews
* Users will have a feed page that recommends their friend's reviews
* Users will be able to upload playlists for friends to see on their own page
* Users will be able to visit the page of other users to add them as friends, read their reviews, and see their playlists

### NON-FUNCTIONAL REQUIREMENTS
* The app should work on Android and iOS
* The UI should be clean and intuitive
* The database must support at least 1,000 concurrent users
* The database and app should be secure against basic attacks and vulnerabilities
* The app and database should be available 24/7
* Offline viewing should be available for selected albums, songs, or genres
* The database should be easy to scale, maintain and update
* The reviews should be out of 5 stars and have optional text
* Leaderboards for top rated songs and albums should be available for viewing

---

## DATABASE REQUIREMENTS

### ER DIAGRAM IMAGES
Jukeboxd Entity Relationship Diagram

![ERD](./ERD.png)

---

## SCHEMA DIAGRAM
Jukeboxd Relational Schema Diagram

![ERD](./Schema.png)

---

## BUSINESS RULES

### Field Rules
* Usernames must be at least 5 characters long and no longer than 12 characters
* The text field of a review cannot exceed 300 characters in length
* A review must have a star input (out of 5 stars, including 0)
* No duplicate usernames
* No duplicate emails

### Relational Rules
* An album must have at least 1 song
* An album must have at least 1 artist
* An artist must have at least 1 album
* An artist must have at least 1 song
* A review must have at least 1 album, artist, or song
* A review must have a star input (out of 5 stars, including 0)

### Role Rules
* Users cannot modify other users
* Users can make reviews
* Users can "like" any other user's reviews
* Users can edit their own reviews
* Users can delete their own reviews
* Users can delete their own account
* Admin users can delete other users
* Admin users can delete songs
* Admin users can delete reviews
* Admin users can delete artists
* Admin users can delete albums
* Admin users can create new genres
* Admin users can modify descriptive tags

### Application Rules
* Passwords cannot be a single dictionary word (putting password rules here because we do not store plaintext passwords in the database, so any logic will be in the application)
* Password must be 8 characters long and no longer than 16
* Password must contain a combination of Upper and Lowercase letters
* Password must have at least 1 non-alphabetical character
* Each review must have a timestamp

---

## DATABASE DOCUMENTATION

### GITHUB DOCUMENTATION
Jukeboxd is a public GitHub. To access the scripts that we have used to create our database, click [this link](https://github.com/sord0250/Jukeboxd-ITC350) and go to the 'Milestone 3' folder found under the 'Jukeboxd' folder. You will find the following scripts that contain SQL queries that configure the database, fill it with "dummy data," and empty the tables:

* 'Create Tables'
* 'DeleteAll'
* 'DeleteSome'
* 'Insert'

The scripts are also listed in Appendix 3 of this document.

As you can see in the screenshot below, each of the 5 team members can contribute to this repository.
![commits](./commits.png)

### NECESSARY DEPENDENCIES
* **GITHUB** - our scripts and code live on the GitHub repository mentioned above.
* **VSCODE** - although not necessary, we use VSCode to connect to our repository. This allows us to edit scripts and work together on the project. If you don’t know how to clone the repository, follow [these instructions](https://code.visualstudio.com/docs/sourcecontrol/repos-remotes). 
* **MySQL Server** - allows for a locally hosted MySQL database to be created.
* **MySQL Workbench** - connects to the server and provides a graphical user interface (GUI) to run the queries that build the tables and populate them with dummy data. This application also allows users to see tables and their data.

### CREATING THE DATABASE
Listed below are the steps to create a locally hosted MySQL database instance of Jukeboxd. These instructions include setting up the MySQL Server and executing the queries.

1) Install [MySQL Server](https://dev.mysql.com/downloads/mysql/) and [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) using default settings. Click on the hyperlinks to ensure you download the correct versions (you will want the most up-to-date version of both).
   a) Set a default password for the MySQL Server that you will remember.
2) In MySQL Workbench:
   a) Connect to local database instance (Local instance MySQL 96)
   b) Run the scripts found on our GitHub (by pasting the file contents and selecting the lightning button) in the following order:
      i) [CreateTables](https://github.com/sord0250/Jukeboxd-ITC350/blob/main/jukeboxd/Milestone%203/CreateTables) - this creates the database and the necessary tables
      ii) [Insert](https://github.com/sord0250/Jukeboxd-ITC350/blob/main/jukeboxd/Milestone%203/Insert) - this inserts dummy data into the tables
      iii) [DeleteSome](https://github.com/sord0250/Jukeboxd-ITC350/blob/main/jukeboxd/Milestone%203/DeleteSome) - this gives specific examples of how to delete dummy data from the tables. This represents the kind of queries that could be sent to the database by the frontend to delete specific reviews, songs, etc..
      iv) [DeleteAll](https://github.com/sord0250/Jukeboxd-ITC350/blob/main/jukeboxd/Milestone%203/DeleteAll) - this deletes all data from tables (note: this script uses 'ALTER TABLE <table_name> AUTO_INCREMENT = 1' so that dummy data can be inserted again after deletion).

To view the database structure at any time, go to the left-hand column. Switch from administration to schemas, and click the refresh button. The database and tables will be shown in that column.

---

## DATABASE VIEW DOCUMENTATION
We created six unique views for our database. Listed below are the unique views along with the purpose they serve.

* [**Search View**](https://github.com/sord0250/Jukeboxd-ITC350/blob/main/jukeboxd/Milestone%204/Search%20Review%20View) - combines the songs, albums, and artists into one view that will be used to implement the search bar functionality
  * i.e. a user will be able to click on the search bar and search for any song, album, or artist.

* [**Album Review View**](https://github.com/sord0250/Jukeboxd-ITC350/blob/main/jukeboxd/Milestone%204/Album%20Review%20View) - combines the album information and any reviews of albums, allowing a list of reviews of albums when a user selects an album.
  * i.e. a user will be able to select an album and see a list of all reviews of that particular album.

* [**Song Review View**](https://github.com/sord0250/Jukeboxd-ITC350/blob/main/jukeboxd/Milestone%204/Song%20Review%20View) - combines song information and reviews of any songs, along with artist name and album name, allowing for a list of song information and song reviews when a song is selected.
  * i.e. a user will be able to select a song and see its artist, the album it is in, and a list of all the reviews of that particular song.

* [**Artist Review View**](https://github.com/sord0250/Jukeboxd-ITC350/blob/main/jukeboxd/Milestone%204/Artist%20Review%20View) - combines artist information with reviews of said artists, which will be used to list reviews of any artists when a user selects an artist.
  * i.e. a user will be able to select a particular artist and see a list of all reviews of that artist.

* [**User’s Reviews**](https://github.com/sord0250/Jukeboxd-ITC350/blob/main/jukeboxd/Milestone%204/Users%20Reviews%20View) - combines user information with review information which will be used so a user can see a history of their reviews.
  * i.e. a user will be able to select their own profile or another user’s profile and see a list of all their reviews, regardless of review type.


To see the queries that are run to create the views, click on the hyperlinks above to access the Github or select [this link](https://github.com/sord0250/Jukeboxd-ITC350) and navigate to the milestone 4 folder. They are also stored in Appendix 4 of this document.

## API DOCUMENTATION

## FRONT-END DOCUMENTATION

## OTHER CHANGES

## APPENDIX 1: LOW-FIDELITY PAPER PROTOTYPES

![lowfideladeez](./lowfideladeez.png)

## APPENDIX 2: SQL SCRIPTS

### CREATE TABLES

```sql
CREATE DATABASE Jukeboxd;
USE Jukeboxd;
```

```sql
CREATE TABLE USER
(
  U_FName VARCHAR(50) NOT NULL,
  U_LName VARCHAR(50) NOT NULL,
  U_Username VARCHAR(12) NOT NULL,
  CHECK (character_length(U_Username) > 4),
  U_PasswordHash TEXT NOT NULL,
  U_ID INT AUTO_INCREMENT NOT NULL,
  U_Email VARCHAR(50) NOT NULL,
  U_Role VARCHAR(50) NOT NULL,
  PRIMARY KEY (U_ID),
  UNIQUE (U_Username),
  UNIQUE (U_Email)
);
```

```sql
CREATE TABLE ALBUM
(
  AL_Name VARCHAR(100) NOT NULL,
  AL_ID INT AUTO_INCREMENT NOT NULL,
  AL_DateCreated DATE NOT NULL,
  AL_Genre VARCHAR(50) NOT NULL,
  PRIMARY KEY (AL_ID)
);
```

```sql
CREATE TABLE ARTIST
(
  ART_ID INT AUTO_INCREMENT NOT NULL,
  ART_Name VARCHAR(50) NOT NULL,
  ART_Genre VARCHAR(50) NOT NULL,
  PRIMARY KEY (ART_ID)
);
```

```sql
CREATE TABLE SONG
(
  S_ID INT AUTO_INCREMENT NOT NULL,
  S_Length INT NOT NULL,
  S_Name VARCHAR(100) NOT NULL,
  S_Genre VARCHAR(50) NOT NULL,
  ART_ID INT NOT NULL,
  AL_ID INT NOT NULL,
  PRIMARY KEY (S_ID),
  FOREIGN KEY (AL_ID) REFERENCES ALBUM(AL_ID),
  FOREIGN KEY (ART_ID) REFERENCES ARTIST(ART_ID)
);
```

```sql
CREATE TABLE REVIEW
(
  R_ID INT AUTO_INCREMENT NOT NULL,
  R_Text VARCHAR(300),
  R_Rating FLOAT NOT NULL,
  CHECK (R_Rating <= 5 AND R_Rating >= 0),
  R_TimeCreated DATETIME NOT NULL,
  R_NumOfLikes INT,
  S_ID INT,
  ART_ID INT,
  AL_ID INT,
  U_Username VARCHAR(12) NOT NULL,
  PRIMARY KEY (R_ID),
  FOREIGN KEY (S_ID) REFERENCES SONG(S_ID),
  FOREIGN KEY (ART_ID) REFERENCES ARTIST(ART_ID),
  FOREIGN KEY (AL_ID) REFERENCES ALBUM(AL_ID),
  FOREIGN KEY (U_Username) REFERENCES USER(U_Username)
);
```

```sql
CREATE TABLE MAKES_SONG
(
  S_ID INT NOT NULL,
  ART_ID INT NOT NULL,
  PRIMARY KEY (S_ID, ART_ID),
  FOREIGN KEY (S_ID) REFERENCES SONG(S_ID),
  FOREIGN KEY (ART_ID) REFERENCES ARTIST(ART_ID)
);
```

```sql
CREATE TABLE MAKES_ALBUM
(
  ART_ID INT NOT NULL,
  AL_ID INT NOT NULL,
  PRIMARY KEY (ART_ID, AL_ID),
  FOREIGN KEY (ART_ID) REFERENCES ARTIST(ART_ID),
  FOREIGN KEY (AL_ID) REFERENCES ALBUM(AL_ID)
);
```

### INSERT STATEMENTS

```sql
INSERT INTO USER (U_Username, U_FName, U_LName, U_PasswordHash, U_Email, U_Role) VALUES 
('AliceWonder', 'Alice', 'Smith', SHA2('pass123', 256), 'alice@example.com', 'User'),
('MelodyMaker', 'Charlie', 'Brown', SHA2('rockon', 256), 'charlie@example.com', 'User'),
('VinylVibes', 'Dana', 'White', SHA2('records4life', 256), 'dana@example.com', 'User'),
('BassBoost', 'Eddie', 'Gomez', SHA2('lowend', 256), 'eddie@example.com', 'User'),
('SynthWave', 'Fiona', 'Gallagher', SHA2('80svibe', 256), 'fiona@example.com', 'User'),
('JazzCat', 'George', 'Miller', SHA2('smoothjazz', 256), 'george@example.com', 'User'),
('MetalHead', 'Hank', 'Hill', SHA2('heavystuff', 256), 'hank@example.com', 'User'),
('PopPrincess', 'Ivy', 'Blue', SHA2('top40', 256), 'ivy@example.com', 'User'),
('LoFiLover', 'Jack', 'Black', SHA2('chillbeats', 256), 'jack@example.com', 'User');
```

```sql
INSERT INTO ARTIST (ART_Name, ART_Genre) VALUES 
('The Electric Ants', 'Indie Rock'),
('Midnight City', 'Synthpop'),
('Lunar Echo', 'Ambient'),
('Iron Strings', 'Metal'),
('Velvet Voice', 'Jazz'),
('Neon Dreams', 'Electronic'),
('The Acoustic Trio', 'Folk'),
('Durban Beats', 'Afrobeats'),
('Cloud Nine', 'Lo-Fi'),
('Rhythm Kings', 'Funk');
```

```sql
INSERT INTO ALBUM (AL_Name, AL_DateCreated, AL_Genre) VALUES 
('Static Skies', '2019-05-12', 'Indie Rock'),
('Midnight Run', '2020-11-01', 'Synthpop'),
('Void', '2021-02-14', 'Ambient'),
('Rusty Gears', '2017-08-30', 'Metal'),
('Blue Notes', '2022-01-05', 'Jazz'),
('Digital Pulse', '2023-06-15', 'Electronic'),
('Campfire Songs', '2016-10-10', 'Folk'),
('Sunlight', '2022-09-22', 'Afrobeats'),
('Sleepy Head', '2021-12-01', 'Lo-Fi'),
('Groove Nation', '2018-04-04', 'Funk');
INSERT INTO MAKES_ALBUM (ART_ID, AL_ID) VALUES 
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10);
```

```sql
INSERT INTO SONG (S_Length, S_Name, S_Genre, ART_ID, AL_ID) VALUES 
('210', 'Electric Dreams', 'Indie Rock', 2, 2),
('195', 'Low Light', 'Indie Rock', 2, 2),
('240', 'Synth City', 'Synthpop', 3, 3),
('205', 'After Hours', 'Synthpop', 3, 3),
('420', 'Event Horizon', 'Ambient', 4, 4),
('380', 'Stardust', 'Ambient', 4, 4),
('215', 'Heavy Metal Thunder', 'Metal', 5, 5),
('233', 'Grinding Gears', 'Metal', 5, 5),
('285', 'Autumn Leaves', 'Jazz', 6, 6),
('310', 'Coffee Shop Blues', 'Jazz', 6, 6),
('190', 'Glitch in the Matrix', 'Electronic', 7, 7),
('200', 'Pulse Rate', 'Electronic', 7, 7),
('185', 'Mountain Air', 'Folk', 8, 8),
('220', 'River Flow', 'Folk', 8, 8),
('245', 'Lagos Night', 'Afrobeats', 9, 9),
('212', 'Island Sun', 'Afrobeats', 9, 9),
('145', 'Lo-Fi Chill', 'Lo-Fi', 10, 10),
('160', 'Study Session', 'Lo-Fi', 10, 10),
('275', 'Get Up and Dance', 'Funk', 1, 1),
('290', 'The Funky Penguin', 'Funk', 1, 1);
```

```sql
INSERT INTO MAKES_SONG (ART_ID, S_ID) VALUES 
(2, 1), (2, 2), (3, 3), (3, 4), (4, 5), (4, 6), (5, 7), (5, 8), (6, 9), (6, 10), (7, 11), (7, 12), (8, 13), (8, 14), (9, 15), (9, 16), (10, 17), (10, 18), (1, 19), (1, 20); 
```

```sql
INSERT INTO REVIEW (R_Text, R_Rating, R_TimeCreated, R_NumOfLikes, S_ID, ART_ID, AL_ID, U_Username) VALUES 
('Incredible production quality.', 5, '2024-05-21 10:00:00', 5, 2, 1, 1, 'AliceWonder'),
('A bit too slow for me.', 2, '2024-05-22 08:15:00', 1, 3, 2, 2, 'MelodyMaker'),
('This album changed my life.', 5, '2024-05-23 12:00:00', 12, 3, 3, 3, 'VinylVibes'),
('The guitar solo is insane!', 4, '2024-05-24 16:45:00', 3, 4, 1, 1, 'BassBoost'),
('Perfect for studying.', 5, '2024-05-25 22:30:00', 8, 9, 3, 3, 'SynthWave'),
('Not their best work.', 3, '2024-05-26 09:10:00', 0, 1, 5, 3, 'JazzCat'),
('Heavy and melodic.', 4, '2024-05-27 11:00:00', 4, 4, 1, 3, 'MetalHead'),
('Catchy but repetitive.', 3, '2024-05-28 14:20:00', 2, 6, 1, 3, 'PopPrincess'),
('Total vibe.', 5, '2024-05-29 19:00:00', 10, 10, 3, 3, 'LoFiLover');
```

### DELETE STATEMENTS

```sql
-- Deleting 'AliceWonder'
DELETE FROM REVIEW WHERE U_Username = 'AliceWonder';
DELETE FROM USER WHERE U_Username = 'AliceWonder';
```

```sql
-- Deleting 'MetalHead'
DELETE FROM REVIEW WHERE U_Username = 'MetalHead';
DELETE FROM USER WHERE U_Username = 'MetalHead';
```

```sql
-- Deleting 'Neon Lights' (S_ID = 3)
DELETE FROM MAKES_SONG WHERE S_ID = 3;
DELETE FROM REVIEW WHERE S_ID = 3;
DELETE FROM SONG WHERE S_ID = 3;
```

```sql
-- Deleting 'Anthem' (S_ID = 2)
DELETE FROM MAKES_SONG WHERE S_ID = 2;
DELETE FROM REVIEW WHERE S_ID = 2;
DELETE FROM SONG WHERE S_ID = 2;
```

```sql
-- Deleting Artist 'Midnight City' (ART_ID = 3) and their Album 'Void' (AL_ID = 3)
DELETE FROM REVIEW WHERE ART_ID = 3 OR AL_ID = 3;
DELETE FROM MAKES_SONG WHERE ART_ID = 3;
DELETE FROM MAKES_ALBUM WHERE ART_ID = 3 OR AL_ID = 3;
```

```sql
-- Deleting Artist 'Lunar Echo' (ART_ID = 4) and their Album 'Rusty Gears' (AL_ID = 4)
DELETE FROM REVIEW WHERE ART_ID = 4 OR AL_ID = 4;
DELETE FROM MAKES_SONG WHERE ART_ID = 4;
DELETE FROM MAKES_ALBUM WHERE ART_ID = 4 OR AL_ID = 4;
DELETE FROM SONG WHERE AL_ID = 4;
DELETE FROM ALBUM WHERE AL_ID = 4;
DELETE FROM ARTIST WHERE ART_ID = 4;
```

### DELETE EVERYTHING

```sql
DELETE FROM REVIEW;
ALTER TABLE REVIEW AUTO_INCREMENT = 1;
DELETE FROM USER;
ALTER TABLE USER AUTO_INCREMENT = 1;
DELETE FROM MAKES_SONG;
DELETE FROM MAKES_ALBUM;
DELETE FROM SONG;
ALTER TABLE SONG AUTO_INCREMENT = 1;
DELETE FROM ALBUM;
ALTER TABLE ALBUM AUTO_INCREMENT = 1;
DELETE FROM ARTIST;
ALTER TABLE ARTIST AUTO_INCREMENT = 1;
```

## APPENDIX 3: SQL VIEWS

### SEARCH VIEW

```sql
USE jukeboxd;
CREATE OR REPLACE VIEW search AS 
SELECT 
    s.S_Name AS Song,
    s.S_Length,
    s.S_Genre AS Song_Genre,
    ar.ART_Name AS Artist,
    ar.ART_Genre AS Artist_Genre,
    al.AL_Name AS Album,
    al.AL_Genre AS Album_Genre
FROM song s
JOIN artist ar 
    ON s.ART_ID = ar.ART_ID
JOIN album al 
    ON s.AL_ID = al.AL_ID;
```

### ALBUM REVIEW VIEW
```sql
USE jukeboxd;
CREATE or REPLACE VIEW album_reviews AS
SELECT album.AL_ID AS id,
    AL_Name AS name,
    AL_Genre AS genre,
    R_ID AS review_id,
    R_Text AS review_text,
    R_Rating AS review_rating,
    R_TimeCreated AS time_created,
    R_NumOfLikes AS review_num_likes
FROM album
JOIN review
	ON album.AL_ID = review.AL_ID;
```

### SONG REVIEW VIEW
```sql
USE jukeboxd;
CREATE OR REPLACE VIEW song_review AS
SELECT 
	S_Name, 
	S_Genre, 
	R_Text, 
	R_Rating, 
	R_TimeCreated, 
	R_NumOfLikes, 
	AL_Name, 
	ART_Name
FROM jukeboxd.song
JOIN review 
	ON review.S_ID = song.S_ID
JOIN album 
	ON album.AL_ID = song.AL_ID
JOIN artist 
	ON artist.ART_ID = song.ART_ID;
```

### ARTIST REVIEW VIEW
```sql
USE jukeboxd;
CREATE or REPLACE VIEW artist_review AS
SELECT 
    a.ART_ID,
    a.ART_Name,
    a.ART_Genre,
    b.R_ID,
    b.R_Text,
    b.R_Rating,
    b.R_TimeCreated,
    b.R_NumOfLikes
FROM artist a
JOIN review b
	ON a.ART_ID = b.ART_ID;
```

### USER REVIEW VIEW
```sql
CREATE or REPLACE VIEW user_reviews AS
SELECT
	u.U_Username,
	u.U_ID,
	r.R_ID,
	r.R_Text,
	r.R_Rating,
	r.R_TimeCreated,
	r.R_NumOfLikes
FROM user u
JOIN review r
	ON u.U_Username = r.U_Username;
```


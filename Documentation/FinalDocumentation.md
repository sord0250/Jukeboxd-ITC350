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

*Diagram elements included:* U FName, 12LName, UID, U Name, U Username, UPasswordHash, USER, U Emall, U Role, ALID, AL Name, AL DateCreated, AL Genre, Makes Review, RID, Of Album, AR ID, S Genre, Contains Song, ALBUM, SR, R NumOfLikes 0), R.Text (0), R. Rating, REVIEW, Of Song, RTimeCroatod, ALID, Of Artist, 5.Length, 5. Name, SONG, Makes Album, ART Name, 오, Makes Song, ARTIST, ART Genre, ART ID.

---

## SCHEMA DIAGRAM
Jukeboxd Relational Schema Diagram

*Diagram elements included:* U Username, U FName, ULName, USER, U Password Hash, UID, U Email, U Role, REVIEW, (U), BID, R.Text, R.Rating, R TimeCreated, R.NumOfLikes, SID, ART ID ALID, Username, (FK) (0), (FK) (O), (FK)(0), (FK), SIR, AL ID, AL Name, AL DateCreated, AL Genre, ALBUM, S Length, 5.Name, S. Genre, AR ID, ALID, ALID, ART ID ALID, SONG, (0), (0), SID, ART ID, MAKES_SONG, (FK) (FK), ARTIST, ART ID, ART Name, ART Genre, (FK), MAKES ALBUM, (FK) (FK).

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
Jukeboxd is a public GitHub. To access the scripts that we have used to create our database, click this link https://github.com/sord0250/Jukeboxd-ITC350 and go to the 'Milestone 3' folder found under the 'Jukeboxd' folder. You will find the following scripts that contain SQL queries that configure the database, fill it with "dummy data," and empty the tables:

* 'Create Tables'
* 'DeleteAll'
* 'DeleteSome'
* 'Insert'

The scripts are also listed in Appendix 3 of this document.

As you can see in the screenshot below, each of the 5 team members can contribute to this repository.
* RobKing2001 | 8 commits: 660 618-
* jamesds11 | #1 | #2 | 5 commits 166 84-
* Contributions | 5429 | 19 Jan | 2 Feb | 16 Feb
* bremlew | 2 commits 1070- | #3 | Contributions: | 642Q | 19 Jan | 2.Feb | 16 Feb
* Contributions | 6420 | 19 Jan | 2 Feb | 16 Feb
* neonsushi | 1 commit 2440
* sord0250 | 1 commit 5100- | #5 | 6 | 19 Jan | 2 Feb | 16 Feb | #4 | 6 | 19 Jan | 2 Feb | 16 Feb
* Contributions | 4 | 2
* Contributions | 4 | 20

### NECESSARY DEPENDENCIES
* **GITHUB** - our scripts and code live on the GitHub repository mentioned above.
* **VSCODE** - although not necessary, we use VSCode to connect to our repository. This allows us to edit scripts and work together on the project. If you don’t know how to clone the repository, follow these instructions: https://code.visualstudio.com/docs/sourcecontrol/repos-remotes.
* **MySQL Server** - allows for a locally hosted MySQL database to be created.
* **MySQL Workbench** - connects to the server and provides a graphical user interface (GUI) to run the queries that build the tables and populate them with dummy data. This application also allows users to see tables and their data.

### CREATING THE DATABASE
Listed below are the steps to create a locally hosted MySQL database instance of Jukeboxd. These instructions include setting up the MySQL Server and executing the queries.

1) Install MySQL Server and MySQL Workbench using default settings. Click on the hyperlinks to ensure you download the correct versions (you will want the most up-to-date version of both).
   a) Set a default password for the MySQL Server that you will remember.
2) In MySQL Workbench:
   a) Connect to local database instance (Local instance MySQL 96)
   b) Run the scripts found on our GitHub (by pasting the file contents and selecting the lightning button) in the following order:
      i) ‘CreateTables’ - this creates the database and the necessary tables
      ii) ‘Insert’ - this inserts dummy data into the tables
      iii) ‘DeleteSome’ - this gives specific examples of how to delete dummy data from the tables. This represents the kind of queries that could be sent to the database by the frontend to delete specific reviews, songs, etc..
      iv) ‘DeleteAll’ - this deletes all data from tables (note: this script uses ‘ALTER TABLE <table_name> AUTO_INCREMENT = 1’ so that dummy data can be inserted again after deletion).

To view the database structure at any time, go to the left-hand column. Switch from administration to schemas, and click the refresh button. The database and tables will be shown in that column.

---

## DATABASE VIEW DOCUMENTATION
We created six unique views for our database. Listed below are the unique views along with the purpose they serve.

* **Search View** - combines the songs, albums, and artists into one view that will be used to implement the search bar functionality
  * i.e. a user will be able to click on the search bar and search for any song, album, or artist.
* **Album Review View** - combines the album information and any reviews of albums, allowing a list of reviews of albums when a user selects an album.
  * i.e. a user will be able to select an album and see a list of all reviews of that particular album.
* **Song Review View** - combines song information and reviews of any songs, along with artist name and album name, allowing for a list of song information and song reviews when a song is selected.
  * i.e. a user will be able to select a song and see its artist, the album it is in, and a list of all the reviews of that particular song.
* **Artist Review View** - combines artist information with reviews of said artists, which will be used to list reviews of any artists when a user selects an artist.
  * i.e. a user will be able to select a particular artist and see a list of all reviews of that artist.
* **User’s Reviews** - combines user information with review information which will be used so a user can see a history of their reviews.
  * i.e. a user will be able to select their own profile or another user’s profile and see a list of all their reviews, regardless of review type.

To see the queries that are run to create the views, click on the hyperlinks above to access the Github or select the following link: https://github.com/sord0250/Jukeboxd-ITC350 and navigate to the milestone 4 folder. They are also stored in Appendix 4 of this document.

## API DOCUMENTATION

## FRONT-END DOCUMENTATION

## APPENDIX 1: LOW-FIDELITY PAPER PROTOTYPES

## APPENDIX 2: HIGH-FIDELITY PAPER PROTOTYPES
[images]

## APPENDIX 3: SQL SCRIPTS

### CREATE TABLES
```sql
CREATE DATABASE Jukeboxd;
USE Jukeboxd;
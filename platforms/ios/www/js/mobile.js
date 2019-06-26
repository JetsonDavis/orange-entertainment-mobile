document.addEventListener("deviceready", onDeviceReady, false);

  // Cordova is ready
  //
  function onDeviceReady() {
      //var db = window.openDatabase("test", "1.0", "Test DB", 1000000);
      
      
  }
  function queryCheckDBExists(tx){
      tx.executeSql('DROP TABLE ACCESS_LOG');
      tx.executeSql('DROP TABLE FILMS');
      tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='ACCESS_LOG'", [], function (tx, result) {
          if (result.rows.length == 0) {
              db.transaction(initCreateTables);
          }
      });
  }
  
  function initCreateTables(tx){
      alert('First Run!  Set up tables')
      tx.executeSql('CREATE TABLE IF NOT EXISTS ACCESS_LOG (id unique, data)');
      tx.executeSql('INSERT INTO ACCESS_LOG (id, data) VALUES (?, ?)',[1, "date.now()"]);
      
      c = 1;
      db.transaction(populateFilmDB);
  }

// NOT USED
  function querySuccess_DBCount(tx, results) {
      c = results.rows.length;
      alert('qS_DBCount | c=' + c)
      if (typeof c === 'undefined'){
          // There is no data so must be first run!
          c=0;
      }    
  }
   
function populateFilmDB(tx) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;//January is 0, so always add + 1
    var yyyy = today.getFullYear();
    var tme = today.getTime().toString();
    
    alert('populateFilmDB | c = ' + c + " | Time: " + mm+"/"+dd+"/"+yyyy + " | " + tme)
    
    // Timestamp usage
    tx.executeSql('CREATE TABLE IF NOT EXISTS FILMS (id unique, nid, title, director, status, genre, budget,\
        cvgexists,addl_avails,tracking, all_pass, logline, notes, script_log, film_list, script_fid, screenings,\
        language, mirjam_read, coverage)');
    tx.executeSql('DELETE FROM FILMS');
    
    tx.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name='FILMS'", [], function (tx, result) {
          if (result.rows.length == 0) {
              alert('Films Table Not Created')
          }
      });
        
          $.support.cors = true;
          $.mobile.allowCrossDomainPages = true;
          $.ajax({
            type: 'GET',
            dataType : 'json',
            cache: false,
            crossDomain: true,
            url: 'http://www.orange-ent.net/m_get_current_film_dump',
            error: function(jqXHR, txtStatus, errorThrown){
                alert('Error! | ' + jqXHR.responseText + ' | ' + txtStatus + ' | ' +errorThrown + ' | ');},
            success: function(obj){
                data_str = JSON.stringify(obj);   //<---- there must be a way to combine these two lines into one?
                data = JSON.parse(data_str);
                db.transaction(fillFilms);
                
            }
        });
        
    alert('Films db filled')
}

function fillFilms(tx){
    var count = 0;
    var str = '';
    for (var key in data) {
         //alert(count + " | " + data[key][0])
         tx.executeSql('INSERT INTO FILMS (id unique, nid, title, director, status, genre, budget,\
             cvgexists,addl_avails,tracking, all_pass, logline, notes, script_log, film_list, script_fid, screenings,\
             language, mirjam_read, coverage) \
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[c+1, data[key][0],
             data[key][1], data[key][2], data[key][3], data[key][6], data[key][7], data[key][8], data[key][9],
             data[key][11], data[key][12], data[key][4], data[key][5], data[key][13], data[key][14], data[key][15],
             data[key][16], data[key][17], data[key][18], data[key][10]]); 
         //alert('Insert complete')
         str += "Nid: " + data[key][0];
         str += "<br/>Title: " + data[key][1];
         str += "<br/>Director: " + data[key][2];
         str += "<br/>Status: " + data[key][3];
         str += "<br/>Genre: " + data[key][6];
         str += "<br/>Budget: " + data[key][7];
         str += "<br/>Coverage Exists: " + data[key][8];
         str += "<br/>Addl Avails: " + data[key][9];
         str += "<br/>Tracking: " + data[key][11];
         str += "<br/>All Pass: " + data[key][12];
         str += "<br/>Logline: " + data[key][4];
         str += "<br/>Notes: " + data[key][5];
         str += "<br/>Script Log: " + data[key][13];
         str += "<br/>Film List: " + data[key][14];
         str += "<br/>Script fid: " + data[key][15];
         str += "<br/>Screenings: " + data[key][16];
         str += "<br/>Language: " + data[key][17];
         str += "<br/>Mirjam Read: " + data[key][18];
         str += "<br/>Coverage: " + data[key][10];
         count++;
     }
     alert('Return from Ajax - Count: ' + count)
     //alert('Return from Ajax - string: ' + str.substring(1,500))
     
     $('#test_results').html(str);
     
     $.mobile.changePage("#m_test", { transition: "slide"} );
     navigator.notification.alert(
            'Cordova is XXXeady!',       // message
            function() {},  // callback
            'Congratulations',            // title
            'Done'                      // buttonName
    );
    
}

    function errorCB(err) {
        alert("Error processing SQL: "+err.code);
    }

var c = 0;
var db, data;  
$(document).ready(function () {
    if (!window.openDatabase) {
     alert('Databases are not supported in this browser.');
     return;
    }
    
    alert('Greetings')
    
    db = window.openDatabase("Orange", "1.0", "Orange_Mobile_DB", 1000000);
    
    db.transaction(queryCheckDBExists);
    
    $(document).on("click","#m_salesco_btn", function(event){
        $(this).removeClass('')
        alert($(this).text())
    })
    
	$(document).on("click", "li" ,function (event) {
	    var nid = $(this).attr("name");
        // We have nid, so hit callback to get detail info
        jQuery.ajax({
        	type: 'GET',dataType : 'text',cache: false,
       		url: 'http://www.orange-ent.net/m_get_film_data',
       		data: {nid: nid},
       		success: function(obj){
       		    // data successfully returned - create page
       		    data = jQuery.parseJSON(obj)
       		    var lang = ((data['field_language_value'] = null) ? '':data['field_language_value'])
       		    $('#results').html('</br></br>' +
       		        'Title: ' + data['title'] + '</br>' +
       		        'Sales Company: ' + data['field_compname_value'] + '</br>' +
       		        'Genre: ' + data['field_genre_value'] + '</br>' +
       		        'Language: ' + lang + '</br>' +
       		        'Cast: ' + data['cast'] + '</br>' +
       		        'Director: ' + data['field_director_value'] + '</br>' +
       		        'Writer(s): ' + data['writer'] + '</br>' +
       		        'Producer(s): ' + data['producer'] + '<div data-role="collapsable-set" data-theme="a">' +
       		        '<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Logline</h3>' + data['field_logline_value'] + '</div>' +
       		        '<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Notes</h3>' + data['field_notes_value'] + '</div>' +
       		        '<div data-role="collapsible" data-collapsed="true" data-theme="a" data-content-theme="b"><h3>Coverage</h3>' + data['field_coveragetextonly_value'] + '</div></div>'
       		        
       		    );
       		    $.mobile.changePage("#m_film_detail", { transition: "slide"} );
       		    $('[data-role="content"]').trigger('create');
       		}    	
          }); 
        
        
    });
});

$('.login-input').on('focus', function() {
  $('.login').addClass('focused');
});

$('.login').on('submit', function(e) {
  e.preventDefault();
  $('.login').removeClass('focused').addClass('loading');
});

$(document).ready(function(){
    $( "#loguinbtn" ).click(function() {
        logueo();
    });
})

function logueo(){
   var usuario = $("#userid").val();
   var contraseña = $("#passid").val();
   var ObjPriData={
                "userName":usuario,
                "password": contraseña
            };
    
    if(usuario == "" && contraseña == ""){
        alert("Debe completar los datos requeridos.");
        window.location.href = 'index.html';
    }else
        {
             $.ajax({
                type: "post",
                url: "/api/login",
                //contentType: "application/json; charset=utf-8",
                data: ObjPriData,
                dataType: "json",
                success: function (result) {
                    if (result != null && typeof result != 'undefined') {
                            document.getElementById("idloguin").style.display = "none";
                            document.getElementById("divPrincipal").style.display = "block";
                    }

                },
                error: function (result) {
                    alert('Error, verifique sus datos.');
                   // alert(result.responseText);
                   window.location.href = 'index.html';
                },
                async: true
            });
    }
    
}
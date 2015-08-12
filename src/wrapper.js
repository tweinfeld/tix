(function(Tix, window){

    // Registration routine
    window["Tix"] = Tix;
    // TBD: Enable amd/commonjs/es2015 module registration

})((function(){
    "use strict";
    <%=contents%>
    return Tix;
})(), window);
var main = function(){
    $('.menu-icon').click(function(){
        if($(this).hasClass('closeMenu')){
            $('.menu').animate({
                left: "0px"
            },200);

            $('body').animate({
                left: "285px"
            },200);
            $(this).removeClass('closeMenu');
        }
        else{
            $(this).addClass('closeMenu');
            $('.menu').animate({
                left: "-285px"
            },200);

            $('body').animate({
                left: "0px"
            },200);
        }
    });
};

$(document).ready(main);
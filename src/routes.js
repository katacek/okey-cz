const Apify = require('apify');

//const { utils: { log } } = Apify;

// at this point, the main page is already loaded in $
exports.handleStart = async ({ $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    //start page, add all categories links to requestQueue
    const links = $('ul.box-menu__line').find('li.box-menu__item:not(.box-menu__item--title)').find('a.box-menu__item__link').map(function ()
    { return $(this).attr('href'); }).get();
    for (let link of links)
    {   
        // request is an object, setting url to link and in userdata, setting new dictionary label: LIST
        // it is me who is setting the label value, just using it for making the crawler fcn more clear
        await requestQueue.addRequest({
            url: link,
            userData: { label: 'LIST' }
        });
    }

};

exports.handleList = async ({ $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    //add detail pages of all products on the page to requestQueue
    const links = $('li.js-gtm-product-wrapper').find('.title').find('a.js-gtm-product-link').map(function ()
    { return $(this).attr('href'); }).get();
    for (let link of links)
    {
        await requestQueue.addRequest({
            url: link,
            userData: { label: 'DETAIL' }
        });
    }

    //add next page to requestQueue, if exists
    const nextLink = $('a.next').attr('href');
    if (nextLink)
    {
        await requestQueue.addRequest({
            url: nextLink,
            userData: { label: 'LIST' }
        });
    }
    
};

exports.handleDetail = async ({ request, $ }) => {
    //parse detail page

    let productDescription = JSON.parse($('div#page-product-detail').children().first().attr('data-product'));


    let result = {};
    result.itemUrl = request.url;
    result.itemId = productDescription.id;
    result.itemName = $('.product-title.js-productTitle').text().trim();
    result.currentPrice = parseInt($('#product_price_wv').text().replace(/\s/g, ''));
    result.originalPrice = parseInt($('#product_price_recomended').text().replace(/\s/g, ''));
    let additionalDiscount = productDescription.labels.find(x => x.includes('SLEVA'));
    if (additionalDiscount)
    {
        additionalDiscount = parseInt(additionalDiscount.replace('SLEVA','').trim());
        if (additionalDiscount)
            result.currentPrice = Math.trunc(result.currentPrice * ((100 - additionalDiscount) / 100));
    }
    if (!result.originalPrice) result.originalPrice = result.currentPrice;
    result.discounted = result.currentPrice < result.originalPrice;
    result.breadcrumb = $('p#menu-breadcrumb').text().trim().split('OKAY »')[1];
    result.currency = "CZK";
    result.inStock = !!$('p#availability:contains(kus)').text();
    result.img = $('a#js-zoomingLinkGallery').attr('href');
    result.vatInfo = $('.price-highlight.price-name').text();

    Apify.pushData(result)
};

const Apify = require('apify');

const { utils: { log } } = Apify;

exports.handleStart = async ({ request, $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    //start page, add all categories to requestQueue
    console.log('I am on the main page')
    const links = $('ul.box-menu__line').find('li.box-menu__item:not(.box-menu__item--title)').find('a.box-menu__item__link').map(function ()
    { return $(this).attr('href'); }).get();
    console.log(links)
    for (link of links)
    {
        await requestQueue.addRequest({
            url: link,
            userData: { label: 'LIST' }
        });
    }

};

exports.handleList = async ({ request, $ }) =>
{
    const requestQueue = await Apify.openRequestQueue();
    //add detail pages of all products on the page to requestQueue
    const links = $('li.js-gtm-product-wrapper').find('.title').find('a.js-gtm-product-link').map(function ()
    { return $(this).attr('href'); }).get();
    for (link of links)
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


    result = {};
    result.itemUrl = request.url;
    result.itemId = productDescription.id;
    result.itemName = $('.product-title.js-productTitle').text().trim();
    result.currentPrice = parseInt($('#product_price_wv').text().replace(/\s/g, ''));
    result.originalPrice = parseInt($('#product_price_recomended').text().replace(/\s/g, ''));
    let additionalDiscount = productDescription.labels.find(x => x.includes('SLEVA')).replace('SLEVA','').trim();
    if (additionalDiscount)
    {
        additionalDiscount = parseInt(additionalDiscount);
        if (additionalDiscount)
            result.currentPrice = Math.trunc(result.currentPrice * ((100 - additionalDiscount) / 100));
    }
    if (!result.originalPrice) result.originalPrice = result.currentPrice;
    result.discounted = result.currentPrice < result.originalPrice;
    result.breadcrumb = $('p#menu-breadcrumb').text().trim().split('OKAY »')[1];
    result.currency = "CZK";
    result.inStock = !!$('p#availability:contains(kus)').text();
    result.img = $('a#js-zoomingLinkGallery').attr('href');

    Apify.pushData(result)
};

/**
 * This template is a production ready boilerplate for developing with `CheerioCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const Apify = require('apify');
const { handleStart, handleList, handleDetail } = require('./routes');

const { utils: { log } } = Apify;

Apify.main(async () => {
    const { startUrls } = await Apify.getInput();

    console.log('Start')

    //const requestList = await Apify.openRequestList('start-urls', startUrls);
    const requestQueue = await Apify.openRequestQueue();
    requestQueue.addRequest({ url: "https://www.okay.cz/mobilni-telefony-3/" });
    console.log('Got the request queue')

    const crawler = new Apify.CheerioCrawler({
       // requestList,
        requestQueue,
        //useApifyProxy: true,
        useSessionPool: true,
        persistCookiesPerSession: true,
        // Be nice to the websites.
        // Remove to unleash full power.
        maxConcurrency: 50,
        handlePageTimeoutSecs:600,
       
        
        handlePageFunction: async (context) => {
            console.log('I am in the handle page fcn.');
            const { url, userData: { label } } = context.request;
            console.log('Page opened.', { label, url });
            log.info('Page opened.', { label, url });
            switch (label) {
                case 'LIST':
                    return handleList(context);
                case 'DETAIL':
                    return handleDetail(context);
                default:
                    return handleStart(context);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});

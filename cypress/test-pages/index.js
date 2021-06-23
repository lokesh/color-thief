var colorThief = new ColorThief();


var images = [
'78ae7e7234b8b39ac0364b6c3fae471d3daff492.webp',
'2ffaf0fbffc0ec2b24530eb43e9c835725eab97b.webp',
'4bc5e2036c0909368f837e6433180b8c8a8f96a8.webp',
'236df642288bd913873afe67a1b37d230004554a.webp',
'ccacabb4f3a7040c79b74133177128452dccb7f1.webp',
'4c2311044b7c09bf5ebb0b73880b13d1cfa74f37.webp',
'76840382820ebc470c5d0e434e40eb5561797bb4.webp',
'c11d9fe0c9be2ebbbda012a5a8e65c4022a874dc.webp',
'f990aac8303b586ce73b494c7f346b7efbc88be8.webp',
'7d7d96da9275380d67a29786f60e1336f2e6f3bd.webp',
'87878fe1f43853ff82d7c67cb4e3cf65dc6bd022.webp',
'6973aa2aebe581986202ab35730fc9a0560a9e39.webp',
'fb53ff2fe6c4cfa4081789a07630853f6531952f.webp',
'd6fe5be92763f3b46bc696a41b9c39457da9e355.webp',
'de2106ec801abaaf885fcfd9da55fd29aea81ae6.webp',
'5d2f792566b1b964a995b95701619182dd9413a8.webp',
'3ac0f9b28d5dde0e750974eac2ad9ed6ba027392.webp',
'1124664d1fad840cd4d998b135f9695ece126ddf.webp',
'f0c93940d00bfda4889d5d36705d79e738dd089f.webp',
'd2d64d852ad665e4417992b0e3b78adb40d612ac.webp',
'b6e283c7dee7b91b433cd22d55376b2ae38b62df.webp',
'fd8cae38266f521735c93bbbdaedcbafae52a2f5.webp',
'133405fcecd5fef8e37ff5c32708cab51759f79e.webp',
'c6a2b9c097d55c850424f3c82372e3cc119f1db9.webp',
'2bc678819641f6ae8324b8202a9b0bd1fdc4986b.webp',
'e4130ef6faa935c4ca5e9b62a6b4a512f4ea1dd6.webp',
'1b3438c7b3a14e2f01839ef8ce946913d8be1006.webp',
'958eff93b9d7ed191e5dae8a648f39f84d023196.webp',
'faa461e410f69dd0c8f064c9056aae3df8fd58e6.webp',
'653011af06d9d7aaa6b8fafdf16bc9a19d13acf2.webp',
'22dee3e44a2641a4d766f63e9b023da085587cf3.webp',
'00dc5bff3b3ec96cc1c7d3124e542af410f5da34.webp',
'ec08892cd4b040df9e0fe656573fbf9b0bf4e07a.webp',
'324d4dc9e5472e04a7caeb9ebeebfd97f8d3cbe1.webp',
'bb194ceefadb5414805925d1fcb5296b595f47a5.webp',
'defd55a0dcfc4d34546683b91aec1b3b529a0069.webp',
'32f7a7e3ff3c34c40f7f1516f8c6f795ad47f827.webp',
'c206b3006136b3434b3f798b80066b8d3327dad4.webp',
'd81fa665d5847d2ac3e28b18fa08c7dea4f8b785.webp',
'b31554738d928b4ba32fecdd342f89b72675f3c3.webp',
'538b064b1e7bedccb10dd9fddf90e5956e20445e.webp',
'291822ba6fffb8df26993e1b06f681071fce5893.webp',
'2f6c607fd1f613da7fb03f2582de32cc5934e6a2.webp',
'fd8cf5bae234c100d5b8516f9006b6d92c6454df.webp',
'aa21e2ff967bf28015db550e2403e56bf4496b04.webp',
'e1cb6b2ce65c7bacc7dde9928e0d43f7cfca0df2.webp',
'58385522815b7331c5fdd694243a009d01930635.webp',
'1b3438c7b3a14e2f01839ef8ce946913d8be1006.webp',
'aa21e2ff967bf28015db550e2403e56bf4496b04.webp',
'013a27299134d1e27d0ded836274d481fbd80f1d.webp',
'dcb29ab5164da41c20d6d0e52efafc9abf1e37ff.webp',
'98ae733b93f41fd9425a43e181c3106cdfef7e85.webp',
'8afc0431d9edfc7452424ce6958dbac8b90d86fd.webp',
'b5827f5eddab72d1b6fefef73d23aaae8f4f1656.webp',
'377fb2577586db7764c42c24315b3a7989e55cae.webp',
'd54eb2eaa16e99b556ce5bf9e473fb538af8155d.webp',
'ea27b35893cb6f66adae8930f31b9236ab2fbb06.webp',
'f74d291b870dd1f29c80cc97fcb080cfd46f1f07.webp',
'41d95e8426256436f18e1305605d6e1f0a25cfec.webp',
'1b3438c7b3a14e2f01839ef8ce946913d8be1006.webp',
    // 'red.png',
    // 'rainbow-horizontal.png',
    // 'rainbow-vertical.png',
    // 'transparent.png',
    // 'white.png',
];

// Render example images
var examplesHTML = Mustache.to_html(document.getElementById('image-tpl').innerHTML, images);
document.getElementById('example-images').innerHTML = examplesHTML;

// Once images are loaded, process them
document.querySelectorAll('.image').forEach((image) => {
    const section = image.closest('.image-section');
    if (this.complete) {
        showColorsForImage(image, section);
    } else {
        image.addEventListener('load', function() {
            showColorsForImage(image, section);
        });
    }
})

// Run Color Thief functions and display results below image.
// We also log execution time of functions for display.
const showColorsForImage = function(image, section) {
    // getColor(img)
    let start = Date.now();
    let result = colorThief.getColor(image);
    let hslColor = rgbToHsl(result[0], result[1], result[2])
    let hslColorCta = rgbToHslCta(result[0], result[1], result[2])
    let elapsedTime = Date.now() - start;
    console.log(hslColorCta);
    const colorHTML = Mustache.to_html(document.getElementById('color-tpl').innerHTML, {
        color: result,
        hsl:hslColor,
        hslCta: hslColorCta,
        colorStr: result.toString(),
        hslStr: hslColor.toString(),
        elapsedTime
    })

    // getPalette(img)
    // let paletteHTML = '';
    // let colorCounts = [2, 3, 5, 7, 10, 20];
    // let colorCounts = [10];

    // colorCounts.forEach((count) => {
    //     let start = Date.now();
    //     let result = colorThief.getPalette(image, count);
    //     let elapsedTime = Date.now() - start;
    //     paletteHTML += Mustache.to_html(document.getElementById('palette-tpl').innerHTML, {
    //         count,
    //         palette: result,
    //         paletteStr: result.toString(),
    //         elapsedTime
    //     })
    // });

    const ribbonEl = section.querySelector('.ribbon');
    ribbonEl.innerHTML = Mustache.to_html(document.getElementById('ribbon-tpl').innerHTML, {
        color: result,
        hsl:hslColor,
        hslCta: hslColorCta,
        colorStr: result.toString(),
        hslStr: hslColor.toString(),
        elapsedTime
    })

    const ctaEl = section.querySelector('.ctaplace');
    ctaEl.innerHTML = Mustache.to_html(document.getElementById('cta-tpl').innerHTML, {
        color: result,
        hsl:hslColor,
        hslCta: hslColorCta,
        colorStr: result.toString(),
        hslStr: hslColor.toString(),
        elapsedTime
    })

    const outputEl = section.querySelector('.output');
    outputEl.innerHTML += colorHTML;
};



const rgbToHsl =   function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) { h = s = 0; }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [(h*360+0.5)|0, ((s*100+0.5)|0) + '%', ((l*100+0.5)|0) + '%'];
}


const rgbToHslCta =   function rgbToHslCta(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) { h = s = 0; }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }
    l = l*100+0.5 -10 > 0 ? l*100+0.5 -10: 0;
    return [(h*360+0.5)|0, ((s*100+0.5)|0) + '%', ((l)|0) + '%'];
}

/**
 * obj: 
 * imgArr image array
 * aniTime duration of the animation
 * intervalTime duration of the image stay
 * autoplay whether to play automatically
 */
function Swiper(obj) {
    this.imgArr = obj.imgArr || [];
    this.retImgArr = [this.imgArr[this.imgArr.length-1], ...this.imgArr, this.imgArr[0]];
    this.aniTime = obj.aniTime || 1500;
    this.intervalTime = obj.intervalTime + this.aniTime || 2500;
    this.nowIndex = 0;

    this.swiperListDom = document.getElementsByClassName('swiper-list')[0];

    this.swiperSpotDom;
    this.leftBtn;
    this.rightBtn;
    this.mainDom;

    this.moveWidth = this.swiperListDom.offsetWidth;
    this.timer = null;

    this.prev = Date.now();

    this.autoplay = obj.autoplay;

}
Swiper.prototype = {
    init: function() {
        this.initDom();

        // Carousel single image li
        let li = '';
        for (let i = 0; i < this.retImgArr.length; i++) {
            li += `<li style="left: ${i * this.moveWidth}px;width: ${this.moveWidth}px" class="swiper-item"><a href="${this.retImgArr[i].url}"><img src="${this.retImgArr[i].imgPath}" alt=""></a></li>`;
        }
        this.mainDom.innerHTML = li;

        // Small circle li
        let spotLi = '';
        for (let i = 0; i < this.imgArr.length; i++) {
            if (i === 0) {
                spotLi += `<li class="spot-item" style="background-color: #ff5c1f;" index=${i}></li>`;
            } else {
                spotLi += `<li class="spot-item" index=${i}></li>`;
            }
        }
        this.swiperSpotDom.innerHTML = spotLi;

        // if (this.autoplay) {
        //     this.timer = setInterval(this.nextSlider.bind(this, this.aniTime), this.intervalTime);
        // }

        // Previous and next image, small circle bind click event
        this.eventBind()
    },
    initDom() {
        // Carousel image dom container
        this.mainDom = document.createElement('ul');
        this.mainDom.className = 'swiper-main';
        this.mainDom.style.width = `${this.moveWidth * (imgArr.length + 2)}px`;
        this.mainDom.style.left = `${-this.moveWidth}px`;
        this.swiperListDom.appendChild(this.mainDom)

        // Small circle ul container
        this.swiperSpotDom = document.createElement('ul');
        this.swiperSpotDom.className = 'swiper-spot';
        this.swiperListDom.appendChild(this.swiperSpotDom)

        // Previous image button
        this.leftBtn = document.createElement('img');
        this.leftBtn.className = 'leftBtn';
        this.leftBtn.src = '../images/blank.png';
        this.leftBtn.alt = '1';
        this.swiperListDom.appendChild(this.leftBtn)

        // Next image button
        this.rightBtn = document.createElement('img');
        this.rightBtn.className = 'rightBtn';
        this.rightBtn.src = '../images/blank.png';
        this.rightBtn.alt = '1';
        if (this.imgArr.length===1) {
            this.leftBtn.style.display = 'none';
            this.rightBtn.style.display = 'none';
        }
        this.swiperListDom.appendChild(this.rightBtn)

    },
    prevSlider(aniTime) {
        let that = this;
        if (this.imgArr.length===1) return;
        this.mainDom.style.transition = `left ${aniTime / 1000}s`
        this.mainDom.style.left = `${parseInt(this.mainDom.style.left) + this.moveWidth}px`;
        if (this.nowIndex === 0) {
            that.nowIndex = (that.imgArr.length-1);
            that.setActiveSpot();
            setTimeout(function() {                    
                that.mainDom.style.transitionProperty = 'none';
                that.mainDom.style.left = `${-that.imgArr.length * that.moveWidth}px`;
            }, aniTime)
        } else {
            this.nowIndex--;
            this.setActiveSpot();
        }
    },
    nextSlider(aniTime) {
        let that = this;
        if (this.imgArr.length===1) return;
        this.nowIndex++;
        this.mainDom.style.transition = `left ${aniTime / 1000}s`
        this.mainDom.style.left = `${parseInt(this.mainDom.style.left) - this.moveWidth}px`;
        if (this.nowIndex === (this.imgArr.length)) {
            that.nowIndex = 0;
            that.setActiveSpot();
            setTimeout(function() {
                that.mainDom.style.transitionProperty = 'none';
                that.mainDom.style.left = `${-that.moveWidth}px`;
            }, aniTime)
        } else {
            this.setActiveSpot();
        }
    },
    setActiveSpot: function() {
        for (let i = 0; i < this.swiperSpotDom.childElementCount; i++) {                
            if (i === Math.abs(this.nowIndex)) {
                document.getElementsByClassName('spot-item')[i].style.backgroundColor = '#ff5c1f'
            } else {
                document.getElementsByClassName('spot-item')[i].style.backgroundColor = '#ccc'
            }
        }
    },
    eventBind() {
        let that = this;
        // Previous image event binding
        this.leftBtn.addEventListener('mouseover', function() {
            clearInterval(that.timer);
        })
        this.leftBtn.addEventListener('mouseout', function() {
            that.timer = setInterval(that.nextSlider.bind(that, that.aniTime), that.intervalTime);
        })
        this.leftBtn.addEventListener('click', function() {
            that.throttle(that.prevSlider, 300, 300);
        })


        // Next image event binding
        this.rightBtn.addEventListener('mouseover', function() {
            clearInterval(that.timer);
        })
        this.rightBtn.addEventListener('mouseout', function() {
            that.timer = setInterval(that.nextSlider.bind(that, that.aniTime), that.intervalTime);
        })
        this.rightBtn.addEventListener('click', function() {
            that.throttle(that.nextSlider, 300, 300);
        })


        // Small circle event binding
        this.swiperSpotDom.addEventListener('mouseover', function() {
            clearInterval(that.timer);
        })
        this.swiperSpotDom.addEventListener('mouseout', function() {
            that.timer = setInterval(that.nextSlider.bind(that, that.aniTime), that.intervalTime);
        })
        this.swiperSpotDom.addEventListener('click', function(e) {
            e = e || window.event; //This line and the next line are for compatibility with IE8 and below
           　　var target = e.target || e.srcElement;
           　　if (target.tagName.toLowerCase() === "li") {
           　　　　 var ret = this.querySelectorAll("li");
           　　　　 let index = Array.prototype.indexOf.call(ret, target);
                that.nowIndex = index;
                that.setActiveSpot();
                that.mainDom.style.transition = `left .8s`
                that.mainDom.style.left = `${-(that.nowIndex+1) * that.moveWidth}px`;
           　　}
        })

        this.mainDom.addEventListener('touchstart', function(e) {
            clearInterval(that.timer);
            that.startX = e.changedTouches[0].clientX;
            that.startY = e.changedTouches[0].clientY;
        })
        this.mainDom.addEventListener('touchmove', function(e) {
            clearInterval(that.timer);
            that.endX = e.changedTouches[0].clientX;
            that.endY = e.changedTouches[0].clientY;
        })
        this.mainDom.addEventListener('touchend', function(e) {
            if (!that.mainDom.style.transition) {
                that.mainDom.style.transition = `left ${that.aniTime / 1000}s`
            }
            let angle = that.angle({ X: that.startX, Y: that.startY }, { X: that.endX, Y: that.endY });
            if (Math.abs(angle) > 30) return;
            if (that.endX > that.startX){ // Swipe right
                that.prevSlider();
            } else { // Swipe left
                that.nextSlider();
            }
            that.timer = setInterval(that.nextSlider.bind(that, that.aniTime), that.intervalTime);
            
        })
    },
    // Throttle: Timestamp version
    throttle(handle, delay, val) {
        var now = Date.now();
        if (now - this.prev >= delay) {
            handle.call(this, val);
            this.prev = Date.now();
        }
    },
    /**
    * Calculate the angle of swipe
    * @param {Object} start starting coordinates
    * @param {Object} end ending coordinates
    */
    angle: function (start, end) {
        var _X = end.X - start.X,
          _Y = end.Y - start.Y
        // Return the angle / Math.atan() returns the arctangent of a number
        return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
    }
}
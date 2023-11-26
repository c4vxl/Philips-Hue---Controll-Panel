const searchParams = new URLSearchParams(window.location.search);
const color__picker = document.querySelector(".color__picker");
const brightness__picker = document.querySelector(".brightness__picker");
const brightness_slider = brightness__picker.querySelector("#brightness__slider");
const onOffSwitch = document.querySelector(".onoffswitch");

async function init() {
    const device = await api.getDevice(searchParams.get("id"));

    if (device.type == Device.TYPE.COLOR_LAMP) {
        color__picker.style.display = "flex";
        brightness__picker.style.display = "flex";
    } else if (device.type == Device.TYPE.DIMMABLE_LAMP) {
        color__picker.style.display = "none";
        brightness__picker.style.display = "flex";
    } else {
        color__picker.style.display = "none";
        brightness__picker.style.display = "none";
    }

    // on off
    onOffSwitch.checked = device.on;
    onOffSwitch.addEventListener("click", () => {
        device.setOnOff(onOffSwitch.checked);
    });

    // brightness
    brightness_slider.value = device.brightness;
    brightness__picker.querySelectorAll("input")[1].value = device.brightness;
    brightness_slider.addEventListener("change", (event) => {
        device.setBrightness(Number(brightness_slider.value));
        brightness__picker.querySelector(".brightness__preview").style.opacity = brightness_slider.value / 100;
    });

    // color
    const red_slider = color__picker.querySelector("#red__slider");
    const green_slider = color__picker.querySelector("#green__slider");
    const blue_slider = color__picker.querySelector("#blue__slider");
    const color__preview = color__picker.querySelector(".color__preview");
    
    red_slider.addEventListener("change", (event) => {
        color__preview.style.backgroundColor = `rgb(${red_slider.value}, ${green_slider.value}, ${blue_slider.value})`;

        device.setColor(red_slider.value, green_slider.value, blue_slider.value);
    });
    green_slider.addEventListener("click", (event) => {
        color__preview.style.backgroundColor = `rgb(${red_slider.value}, ${green_slider.value}, ${blue_slider.value})`;

        device.setColor(red_slider.value, green_slider.value, blue_slider.value);
    });
    blue_slider.addEventListener("click", (event) => {
        color__preview.style.backgroundColor = `rgb(${red_slider.value}, ${green_slider.value}, ${blue_slider.value})`;

        device.setColor(red_slider.value, green_slider.value, blue_slider.value);
    });

    document.querySelector("#name").textContent = device.name;
}

init();
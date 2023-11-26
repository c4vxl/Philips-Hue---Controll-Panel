const navbar = document.querySelector(".navbar");
document.querySelector(".navbar__button").addEventListener("click", event => {
    document.querySelector(".navbar__button").classList.toggle("active");
    navbar.classList.toggle("active");
});

api.getGroups().then(response => {
    // add all groups to navbar
    response.forEach(async group => {
        var parent = document.createElement("li");
        parent.classList.add("group");
        var element = document.createElement("a");
        element.textContent = group.name;
        element.classList.add("group__title");
        element.addEventListener("click", event => {
            event.preventDefault();
            element.parentNode.classList.toggle("active");
        });
        parent.appendChild(element);
        var content = document.createElement("ul");
        content.classList.add("device__content");
        parent.appendChild(content);

        (await group.devices).forEach(device => {
            var p = document.createElement("li");
            var name__container = document.createElement("p");
            var name = document.createElement("a");
            name.href = "#device_" + device.id;
            name.textContent = device.name;
            name__container.appendChild(name);
            p.appendChild(name__container);
            content.appendChild(p);
        });
        document.querySelector(".navbar .navbar__devices").appendChild(parent);
    });

    // add all groups to panel
    response.forEach(async group => {
        var parent = document.createElement("li");
        parent.id = "group_" + group.name.replace(" ", "_");
        var px = document.createElement("div");
        parent.appendChild(px);
        var element = document.createElement("h1");
        element.textContent = group.name;
        px.appendChild(element);
        element = document.createElement("div");
        element.setAttribute("onclick", "this.classList.toggle('active');");
        element.className = "switch";
        if (!((await group.devices).map(x => x.on).includes(false))) element.classList.add("active");
        element.addEventListener("click", event => {
            group.setOnOff(element.classList.contains("active"));
        })
        px.appendChild(element);

        (await group.devices).forEach(device => {
            var p = document.createElement("div");
            p.addEventListener("click", event => {
                window.location.href = "/page/options/?id=" + device.id;
            });
            p.id = "device_" + device.id;
            p.classList.add("device");
            var img__container = document.createElement("div");
            img__container.classList.add("icon__container");
            var element = document.createElement("img");
            element.src = device.type == Device.TYPE.COLOR_LAMP || device.type == Device.TYPE.DIMMABLE_LAMP ? "/img/lamp.png" : "/img/smart plug.png";
            element.alt = "device";
            element.classList.add("icon");
            img__container.appendChild(element);
            p.appendChild(img__container);
            element = document.createElement("p");
            element.textContent = device.name;
            p.appendChild(element);

            parent.appendChild(p);
        });
        document.querySelector(".devices .group__list").appendChild(parent);
    });
});
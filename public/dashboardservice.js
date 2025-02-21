 document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("solarForm");
    const panelType = document.getElementById("panelType");
    const panelQuantity = document.getElementById("panelQuantity");
    const batteryType = document.getElementById("batteryType");
    const batteryQuantity = document.getElementById("batteryQuantity");
    const serviceType = document.getElementById("serviceType");
    const installationDetails = document.getElementById("installationDetails");
    const installationType = document.getElementById("installationType");
    const companyNameField = document.getElementById("companyNameField");
    const serviceOption = document.getElementById("serviceOption");
    const totalPriceElem = document.getElementById("totalPrice");
    const payNowAmountElem = document.getElementById("payNowAmount");
    const remainingBalanceElem = document.getElementById("remainingBalance");
    const termsCheckbox = document.getElementById("terms");
    const payNowButton = document.getElementById("payNowButton");

    let totalPrice = 0;

    function updatePrice() {
        let panelPrice = parseInt(panelType.selectedOptions[0].getAttribute("data-price")) || 0;
        let batteryPrice = parseInt(batteryType.selectedOptions[0].getAttribute("data-price")) || 0;
        let panelQty = parseInt(panelQuantity.value) || 1;
        let batteryQty = parseInt(batteryQuantity.value) || 1;

        totalPrice = (panelPrice * panelQty) + (batteryPrice * batteryQty) ;
       

        // Check if Self-Service is selected
        if (serviceOption.value === "Self-Service") {
            totalPrice *= 0.75; // Apply 25% discount
        }

        // If installation is selected, enforce 30% upfront payment
        let payNowAmount = serviceType.value === "Installation" ? totalPrice * 0.3 : totalPrice;
        let remainingBalance = serviceType.value === "Installation" ? totalPrice * 0.7 : totalPrice;
        totalPriceElem.textContent = totalPrice.toLocaleString();
        payNowAmountElem.textContent = payNowAmount.toLocaleString();
        remainingBalanceElem.textContent = remainingBalance.toLocaleString();
    }

    panelType.addEventListener("change", updatePrice);
    panelQuantity.addEventListener("input", updatePrice);
    batteryType.addEventListener("change", updatePrice);
    batteryQuantity.addEventListener("input", updatePrice);
    serviceOption.addEventListener("change", updatePrice);

    serviceType.addEventListener("change", function () {
        if (serviceType.value === "Installation") {
            installationDetails.style.display = "block";
        } else {
            installationDetails.style.display = "none";
        }
        updatePrice();
    });

    installationType.addEventListener("change", function () {
        companyNameField.style.display = installationType.value === "Company" ? "block" : "none";
    });

    termsCheckbox.addEventListener("change", function () {
        payNowButton.disabled = !termsCheckbox.checked;
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        let userData = {
            username: document.getElementById("username").value,
            email: document.getElementById("email").value,
            address: document.getElementById("address").value,
            phone: document.getElementById("phone").value,
            panelType: panelType.value,
            panelQuantity: panelQuantity.value,
            batteryType: batteryType.value,
            batteryQuantity: batteryQuantity.value,
            batteryKVA: document.getElementById("batteryKVA").value,
            serviceType: serviceType.value,
            installationType: installationType.value,
            companyName: document.getElementById("companyName").value,
            serviceOption: serviceOption.value,
            totalAmount: totalPrice,
            upfrontPayment: totalPrice * 0.3,
        };

        payWithPaystack(userData);
    });

    function payWithPaystack(userData) {
        let email = document.getElementById("email").value;
        let payNowAmount = parseFloat(document.getElementById("payNowAmount").textContent.replace(/,/g, ''))*100;
        let totalPrice = parseFloat(document.getElementById("totalPrice").textContent.replace(/,/g, ''))*100;
        let remainingBalance = parseFloat(document.getElementById("remainingBalance").textContent.replace(/,/g, ''))*100;
        
    let handler = PaystackPop.setup({
        key: 'pk_test_37148156d3759189a11462a9673b8225525a3dfd', // Replace with your Paystack Public Key
        email: userData.email,
        amount: userData.upfrontPayment * 100, // Convert to kobo
        currency: "NGN",
        ref: "FERDRO_" + Math.floor((Math.random() * 1000000000) + 1),
        metadata: {
            custom_fields: [
                {
                    display_name: "Customer Name",
                    variable_name: "customer_name",
                    value: userData.username
                },
                {
                    display_name: "Phone Number",
                    variable_name: "phone_number",
                    value: userData.phone
                },
                {
                    display_name: "Address",
                    variable_name: "address",
                    value: userData.address
                },
                {
                    display_name: "Service Type",
                    variable_name: "service_type",
                    value: userData.serviceType
                },
                {
                    display_name: "Solar Panel Type",
                    variable_name: "panel_type",
                    value: userData.panelType
                },
                {
                    display_name: "Battery Type",
                    variable_name: "battery_type",
                    value: userData.batteryType
                },
                {
                    display_name: "Solar Panel Quantity",
                    variable_name: "panel_quantity",
                    value: userData.panelQuantity
                },
                {
                    display_name: "Battery Quantity",
                    variable_name: "battery_quantity",
                    value: userData.batteryQuantity
                },
                {
                    display_name: "Installation Type",
                    variable_name: "installation_type",
                    value: userData.installationType
                },
                {
                    display_name: "Company Name",
                    variable_name: "company_name",
                    value: userData.companyName
                },
                {
                    display_name: "Service Option",
                    variable_name: "service_option",
                    value: userData.serviceOption
                },
                {
                    display_name: "Total Price",
                    variable_name: "total_price",
                    value: userData.totalPrice
                },
                {
                    display_name: "Amount to Pay Now",
                    variable_name: "pay_now_amount",
                    value: userData.payNowAmount
                },
                {
                    display_name: "Remaining Balance",
                    variable_name: "remaining_balance",
                    value: userData.remainingBalance
                },
            ]
        },
        callback: function (response) {
            alert("Payment Successful! Reference: " + response.reference);

            // Redirect to userpayment.html with user data
            let params = new URLSearchParams(userData).toString();
            window.location.href = `userpayment.html?${params}`;
        },
        onClose: function () {
            alert("Transaction Cancelled");
        },
    });
    handler.openIframe();
}
});

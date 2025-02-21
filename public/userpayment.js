 document.addEventListener("DOMContentLoaded", function () {
            const params = new URLSearchParams(window.location.search);
            const paymentDetailsContainer = document.getElementById("paymentDetails");

            if (params.has("username")) {
                const details = {
                    "Full Name": params.get("username"),
                    "Email": params.get("email"),
                    "Phone Number": params.get("phone"),
                    "Address": params.get("address"),
                    "Solar Panel Type": params.get("panelType"),
                    "Panel Quantity": params.get("panelQuantity"),
                    "Battery Type": params.get("batteryType"),
                    "Battery Quantity": params.get("batteryQuantity"),
                    "Service Type": params.get("serviceType"),
                    "Installation Type": params.get("installationType"),
                    "Company Name": params.get("companyName") || "N/A",
                    "Service Option": params.get("serviceOption"),
                    "Total Amount": `₦${parseFloat(params.get("totalAmount") || 0).toLocaleString()}`,
                    "Upfront Payment (30%)": `₦${parseFloat(params.get("upfrontPayment") || 0).toLocaleString()}`,
                    "Remaining Balance (70%)": `₦${(parseFloat(params.get("totalAmount") || 0) * 0.7).toLocaleString()}`
                };

                let detailsHTML = "<ul>";
                for (let key in details) {
                    detailsHTML += `<li><strong>${key}:</strong> ${details[key]}</li>`;
                }
                detailsHTML += "</ul>";

                paymentDetailsContainer.innerHTML = detailsHTML;
            } else {
                paymentDetailsContainer.innerHTML = "<p>No payment details found.</p>";
            }
        });

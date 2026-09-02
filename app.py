import streamlit as st

# ==============================================================================
# 📊 CENTRAL DATA SOURCE (Simulating Live NZ Price Extractions)
# ==============================================================================
NZ_SUPERMARKET_CATALOGUE = {
    "Whittaker's Creamy Milk Chocolate 250g": {
        "Woolworths": 6.80, "PAK'nSAVE": 5.99, "New World": 6.50, "Historic_Avg": 6.70
    },
    "Anchor Blue Milk 2L": {
        "Woolworths": 4.50, "PAK'nSAVE": 3.98, "New World": 4.25, "Historic_Avg": 4.45
    },
    "Tip Top Bakery Bread 700g": {
        "Woolworths": 3.10, "PAK'nSAVE": 2.89, "New World": 3.40, "Historic_Avg": 3.35
    },
    "Mainland Tasty Cheese 700g": {
        "Woolworths": 13.90, "PAK'nSAVE": 11.95, "New World": 12.99, "Historic_Avg": 13.50
    },
    "Nescafe Instant Coffee 200g": {
        "Woolworths": 7.50, "PAK'nSAVE": 10.50, "New World": 9.99, "Historic_Avg": 10.20
    },
    "Watties Baked Beans 420g": {
        "Woolworths": 2.60, "PAK'nSAVE": 1.95, "New World": 2.20, "Historic_Avg": 2.50
    }
}

# ==============================================================================
# 👤 BACKEND DATA PERSISTENCE INITIALIZATION
# ==============================================================================
if "logged_in_user" not in st.session_state:
    st.session_state.logged_in_user = None

if "registered_accounts" not in st.session_state:
    st.session_state.registered_accounts = {
        "student@uni.ac.nz": {
            "password": "password123",
            "lists": {
                "weekly": ["Anchor Blue Milk 2L", "Tip Top Bakery Bread 700g"],
                "occasional": ["Nescafe Instant Coffee 200g", "Whittaker's Creamy Milk Chocolate 250g"]
            }
        }
    }

# ==============================================================================
# 🧮 OPTIMIZATION LOGIC ENGINES
# ==============================================================================
def process_basket_optimization(items_list):
    if not items_list:
        return 0, 0, 0, 0, {}, {}

    store_totals = {"Woolworths": 0.0, "PAK'nSAVE": 0.0, "New World": 0.0}
    split_optimized_total = 0.0
    split_trip_breakdown = {"Woolworths": [], "PAK'nSAVE": [], "New World": []}

    for item in items_list:
        data = NZ_SUPERMARKET_CATALOGUE[item]
        
        # Track standalone totals
        for store in store_totals.keys():
            store_totals[store] += data[store]

        # Calculate optimal split trip options
        cheapest_store = min(["Woolworths", "PAK'nSAVE", "New World"], key=lambda s: data[s])
        split_optimized_total += data[cheapest_store]
        split_trip_breakdown[cheapest_store].append(item)

    cheapest_single_store = min(store_totals, key=store_totals.get)
    cheapest_single_total = store_totals[cheapest_single_store]
    optimized_savings = cheapest_single_total - split_optimized_total

    return store_totals, cheapest_single_store, split_optimized_total, optimized_savings, split_trip_breakdown, store_totals

# ==============================================================================
# 🖥️ FRONTEND INTERFACE GENERATION
# ==============================================================================
st.set_page_config(page_title="SmartGrocer NZ", page_icon="🛒", layout="wide")

# App Header
st.title("🛒 Smart Grocer NZ")
st.write("University Software Engineering Prototype — Automated Price & Split-Trip Optimizer")

# --- AUTHENTICATION SCREEN VIEW ---
if st.session_state.logged_in_user is None:
    st.subheader("🔑 Account Authentication Portal")
    auth_tab1, auth_tab2 = st.tabs(["Sign In", "Create Free Account"])
    
    with auth_tab1:
        login_email = st.text_input("University Email Address", value="student@uni.ac.nz")
        login_pass = st.text_input("Password", type="password", value="password123")
        if st.button("Access Account"):
            if login_email in st.session_state.registered_accounts and st.session_state.registered_accounts[login_email]["password"] == login_pass:
                st.session_state.logged_in_user = login_email
                st.success("Access Granted! Loading saved profiles...")
                st.rerun()
            else:
                st.error("Invalid credentials provided.")

    with auth_tab2:
        reg_email = st.text_input("New Email Address")
        reg_pass = st.text_input("Choose Secure Password", type="password")
        if st.button("Register Profile"):
            if reg_email and reg_pass:
                st.session_state.registered_accounts[reg_email] = {
                    "password": reg_pass,
                    "lists": {"weekly": [], "occasional": []}
                }
                st.success("Account successfully created. Please navigate to the 'Sign In' tab.")
            else:
                st.warning("Please complete all required fields.")

# --- MASTER LOGGED IN INTERFACE ---
else:
    current_user = st.session_state.logged_in_user
    user_data = st.session_state.registered_accounts[current_user]
    
    # Sidebar Navigation Controller
    st.sidebar.markdown(f"**Authenticated As:**\n`{current_user}`")
    if st.sidebar.button("Secure Logout"):
        st.session_state.logged_in_user = None
        st.rerun()

    # Layout Setup
    left_panel, right_panel = st.columns([1, 1.2])

    with left_panel:
        st.header("📝 Saved Shopping Lists")
        
        # 1. Weekly Rotational Items
        st.subheader("🔄 Regular Weekly Base Items")
        if not user_data["lists"]["weekly"]:
            st.caption("Your core weekly list is empty.")
        else:
            for item in list(user_data["lists"]["weekly"]):
                col_i, col_b = st.columns([4, 1])
                col_i.write(f"🍏 {item}")
                if col_b.button("❌", key=f"del_wk_{item}"):
                    user_data["lists"]["weekly"].remove(item)
                    st.rerun()

        # 2. Occasional Discount Monitor Items
        st.subheader("🌟 Occasional Target Items (Price Monitored)")
        if not user_data["lists"]["occasional"]:
            st.caption("No custom special alerts tracked.")
        else:
            for item in list(user_data["lists"]["occasional"]):
                col_i, col_b = st.columns([4, 1])
                col_i.write(f"📦 {item} *(Monitored)*")
                if col_b.button("❌", key=f"del_occ_{item}"):
                    user_data["lists"]["occasional"].remove(item)
                    st.rerun()

        st.divider()
        
        # 3. Interactive Input Dashboard
        st.subheader("➕ Add Items to Profile Data structures")
        selected_product = st.selectbox("Search NZ Product Registry:", ["-- Choose Item --"] + list(NZ_SUPERMARKET_CATALOGUE.keys()))
        
        if selected_product != "-- Choose Item --":
            frequency_setting = st.radio("Shopping Strategy:", ["Buy standard every week", "Buy only when heavily discounted"])
            if st.button("Append Product to Database Schema"):
                target_key = "weekly" if "every week" in frequency_setting.lower() else "occasional"
                
                # Check for duplications
                if selected_product in user_data["lists"]["weekly"] or selected_product in user_data["lists"]["occasional"]:
                    st.warning("Product already allocated to a structural data array.")
                else:
                    user_data["lists"][target_key].append(selected_product)
                    st.success(f"Linked {selected_product} to your profile framework.")
                    st.rerun()

    with right_panel:
        st.header("💡 Live Recommendation Insights")

        # 🧠 INTELLIGENT DISCOUNT MONITOR ENGINE DETECTOR
        active_cart = list(user_data["lists"]["weekly"])
        deal_alerts_found = False

        for item in user_data["lists"]["occasional"]:
            price_info = NZ_SUPERMARKET_CATALOGUE[item]
            cheapest_current = min(price_info["Woolworths"], price_info["PAK'nSAVE"], price_info["New World"])
            historic_normal = price_info["Historic_Avg"]

            # Trigger automated deal alert if price drop breaks historical thresholds (>12% discount)
            if cheapest_current <= (historic_normal * 0.88):
                deal_alerts_found = True
                calculated_savings = historic_normal - cheapest_current
                st.warning(f"✨ **Smart Discount Detected!** '{item}' is on sale this week at a low of **${cheapest_current:.2f}** (Historical Baseline: ${historic_normal:.2f}). You save ${calculated_savings:.2f}!")
                
                if st.button(f"Inject '{item}' into Active Cart", key=f"deal_inject_{item}"):
                    if item not in active_cart:
                        active_cart.append(item)
                        st.success(f"Injected {item} into your localized pricing optimization run.")
                        st.rerun()

        if not deal_alerts_found:
            st.info("No items within your Occasional List met the deep-discount algorithm threshold this week.")

        st.divider()

        # 🚀 MATHEMATICAL OPTIMIZATION ENGINE RENDERING PANEL
        st.subheader("🏁 Automated Single vs. Multi-Store Optimization Results")
        
        if not active_cart:
            st.info("Populate items inside your active profile view matrix to map metrics.")
        else:
            st.markdown(f"**Active Combined Running Basket:** {len(active_cart)} distinct product items.")
            
            store_totals, single_store, optimal_split, savings, breakdown, all_totals = process_basket_optimization(active_cart)

            col_opt_left, col_opt_right = st.columns(2)

            with col_opt_left:
                st.markdown("### 🏪 Best One-Stop Option")
                st.success(f"🏆 **{single_store}**")
                st.metric(label="Total One-Stop Cost", value=f"${all_totals[single_store]:.2f}")

            with col_opt_right:
                st.markdown("### 🛣️ Best Multi-Store Trip")
                st.info(f"Split across stores for optimal savings")
                st.metric(label="Total Multi-Store Cost", value=f"${optimal_split:.2f}")
                st.metric(label="Total Savings vs One-Stop", value=f"${savings:.2f}")

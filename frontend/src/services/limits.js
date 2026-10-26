// Keep in sync with MAX_QTY_PER_ITEM / MAX_LINE_ITEMS in services/order-service/app/main.py.
// The server enforces these; the cart uses them to stop you before checkout fails.
export const MAX_QTY_PER_ITEM = 10
export const MAX_LINE_ITEMS = 20

def optimize_discounts(discounts: list, budget: int) -> tuple:
    """
    Optimal Discount Allocation using Dynamic Programming (0/1 Knapsack).
    Time Complexity: O(n * budget)
    Use Case: Calculate optimal combination of discounts to maximize conversion rate.
    
    discounts: List of tuples (expected_conversion_increase, cost)
    budget: Max amount we can spend on discounts
    
    Returns: (max_increase, list_of_selected_indices)
    """
    n = len(discounts)
    # dp[i][w] will be the maximum increase we can get with budget w using first i discounts
    dp = [[0 for _ in range(budget + 1)] for _ in range(n + 1)]

    for i in range(1, n + 1):
        increase, cost = discounts[i-1]
        for w in range(budget + 1):
            if cost <= w:
                # Include i-th discount or do not include
                dp[i][w] = max(increase + dp[i-1][w-cost], dp[i-1][w])
            else:
                dp[i][w] = dp[i-1][w]

    # Backtrack to find selected indices
    selected_indices = []
    w = budget
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i-1][w]:
            selected_indices.append(i-1)
            w -= discounts[i-1][1]

    return dp[n][budget], selected_indices

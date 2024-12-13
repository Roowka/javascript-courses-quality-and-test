const { test, expect } = require('@playwright/test');

test.describe('Page d\'accueil - Jeu du Pendu', () => {
    test('La page d\'accueil se charge correctement', async ({ page }) => {
        await page.goto('/');

        // Vérifier le titre de la page
        const title = await page.locator('header h1');
        await expect(title).toHaveText('Le jeu du pendu !');

        // Vérifier la présence des éléments principaux
        await expect(page.locator('#current-word')).toBeVisible();
        await expect(page.locator('input[name="word"]')).toBeVisible();
        await expect(page.locator('#numberOfTries')).toBeVisible();
        await expect(page.locator('#score')).toBeVisible();
    });

    test('Le clavier virtuel est fonctionnel', async ({ page }) => {
        await page.goto('/');

        // Cliquer sur une lettre du clavier
        const letterButton = await page.locator('button:has-text("A")');
        await letterButton.click();

        // Vérifier que l'entrée est mise à jour avec la lettre cliquée
        const input = await page.locator('input[name="word"]');
        await expect(input).toHaveValue('A');
    });

    test('Les lettres désactivées changent de style', async ({ page }) => {
        await page.goto('/');

        // Cliquer sur une lettre
        const letterButton = await page.locator('button:has-text("B")');
        await letterButton.click();

        // Vérifier que la lettre est désactivée
        await expect(letterButton).toBeDisabled();
        await expect(letterButton).toHaveClass(/bg-gray-600/);
    });

    test('Le mot masqué est affiché correctement', async ({ page }) => {
        await page.goto('/');

        // Vérifier que le mot masqué utilise des caractères masqués (#)
        const maskedWord = await page.locator('#current-word span');
        const maskedWordText = await maskedWord.allTextContents();
        maskedWordText.forEach(letter => {
            expect(letter).toBe('#'); // Supposons que le mot soit initialement masqué
        });
    });

    test('Le score et le nombre d\'essais sont visibles', async ({ page }) => {
        await page.goto('/');

        // Vérifier que le score est un nombre et est visible
        const scoreLocator = await page.locator('#score');
        const scoreText = await scoreLocator.textContent();
        const scoreValue = parseInt(scoreText, 10);

        // Vérifier que le score est un nombre entre 0 et 200
        expect(scoreValue).toBeGreaterThanOrEqual(0);
        expect(scoreValue).toBeLessThanOrEqual(200);

        // Vérifier que le nombre d'essais est visible
        const triesLocator = await page.locator('#numberOfTries');
        const triesText = await triesLocator.textContent();

        // Vérifier que les essais restants sont non vides et positifs
        const triesValue = parseInt(triesText, 10);
        expect(triesValue).toBeGreaterThan(0);
    });

});

from locust import HttpUser, TaskSet, task, between
import random
import time

class UserBehavior(TaskSet):

    @task(1)
    def recalculate_and_reset(self):
        """ Simulate clicking the recalculate button and then the reset button after a delay. """
        # Define the slider values that are passed with recalculation
        slider_values = {
            "slope": random.randint(0, 4),
            "streets": random.randint(0, 4),
            "amenity": random.randint(0, 4),
            "crime": random.randint(0, 4)
        }

        # Simulate clicking the 'Recalculate' button by making a POST request
        with self.client.post("/recalculate", json=slider_values, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to recalculate: {response.status_code}")

        # Wait 10 seconds to simulate a user thinking time or analyzing the results
        time.sleep(10)

        # Simulate clicking the 'Reset' button
        with self.client.post("/reset", json={}, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to reset: {response.status_code}")

    @task(2)
    def view_home(self):
        """ Simulate visiting the home page. """
        self.client.get("/")

class WebsiteUser(HttpUser):
    tasks = [UserBehavior]
    wait_time = between(1, 5)  # Users will wait between 1 and 5 seconds between tasks.

    # Update this with your actual target application URL.
    host = "https://whale-app-icxda.ondigitalocean.app/"


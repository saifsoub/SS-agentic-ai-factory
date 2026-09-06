import os
import unittest
from unittest.mock import patch

import main


class Response:
    status = 204

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False


class RunTests(unittest.TestCase):
    def test_missing_token_is_reported_without_a_network_call(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(
            main.urllib.request, "urlopen"
        ) as urlopen:
            result = main.run()
        self.assertEqual(result, {"ok": False, "status": 500, "error": "missing_github_token"})
        urlopen.assert_not_called()

    def test_dispatch_forwards_inputs_and_keeps_token_out_of_result(self):
        with patch.dict(os.environ, {"GITHUB_RUNTIME_TOKEN": "secret"}, clear=True), patch.object(
            main.urllib.request, "urlopen", return_value=Response()
        ) as urlopen:
            result = main.run(property="0108", task="render")

        request = urlopen.call_args.args[0]
        self.assertEqual(request.get_method(), "POST")
        self.assertIn(b'"property": "0108"', request.data)
        self.assertIn(b'"task": "render"', request.data)
        self.assertEqual(result, {"ok": True, "status": 204, "property": "0108", "task": "render"})
        self.assertNotIn("secret", str(result))


if __name__ == "__main__":
    unittest.main()
